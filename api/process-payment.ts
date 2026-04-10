import { VercelRequest, VercelResponse } from '@vercel/node';
import AuthorizeNet from "authorizenet";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder-key'
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { opaqueData, orderData } = req.body;
  console.log('Processing payment request for order total:', orderData?.total);

  const apiLoginId = process.env.AUTHORIZENET_API_LOGIN_ID;
  const transactionKey = process.env.AUTHORIZENET_TRANSACTION_KEY;

  if (!apiLoginId || !transactionKey) {
    console.error('Authorize.net credentials missing in environment');
    return res.status(500).json({ error: "Authorize.net is not configured." });
  }

  try {
    console.log('Initializing Authorize.net transaction...');
    const merchantAuthenticationType = new AuthorizeNet.APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(apiLoginId);
    merchantAuthenticationType.setTransactionKey(transactionKey);

    const opaqueDataType = new AuthorizeNet.APIContracts.OpaqueDataType();
    opaqueDataType.setDataDescriptor(opaqueData.dataDescriptor);
    opaqueDataType.setDataValue(opaqueData.dataValue);

    const paymentType = new AuthorizeNet.APIContracts.PaymentType();
    paymentType.setOpaqueData(opaqueDataType);

    const transactionRequestType = new AuthorizeNet.APIContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(AuthorizeNet.APIContracts.TransactionTypeEnum.AUTH_CAPTURE_TRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(orderData.total);

    // Add line items
    const lineItems: AuthorizeNet.APIContracts.LineItemType[] = orderData.items.map((item: any) => {
      const lineItem = new AuthorizeNet.APIContracts.LineItemType();
      lineItem.setItemId(item.id.substring(0, 31));
      lineItem.setName(item.name.substring(0, 31));
      lineItem.setQuantity(item.quantity);
      lineItem.setUnitPrice(item.price);
      return lineItem;
    });
    const lineItemsArray = new AuthorizeNet.APIContracts.ArrayOfLineItem();
    lineItemsArray.setLineItem(lineItems);
    transactionRequestType.setLineItems(lineItemsArray);

    const createRequest = new AuthorizeNet.APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new AuthorizeNet.APIControllers.CreateTransactionController(createRequest.getJSON());
    // Use Sandbox environment for now
    ctrl.setEnvironment(AuthorizeNet.Constants.endpoint.sandbox);

    return new Promise((resolve) => {
      ctrl.execute(async () => {
        const apiResponse = ctrl.getResponse();
        const response = new AuthorizeNet.APIContracts.CreateTransactionResponse(apiResponse);
        console.log('Authorize.net API response received');

        if (response != null) {
          if (response.getMessages().getResultCode() === AuthorizeNet.APIContracts.MessageTypeEnum.OK) {
            const transactionResponse = response.getTransactionResponse();

            if (transactionResponse != null && transactionResponse.getMessages() != null) {
              // Payment Successful! Now create the order in Supabase
              try {
                const { data: order, error: orderError } = await supabase
                  .from("orders")
                  .insert({
                    user_id: orderData.userId === "guest" ? null : orderData.userId,
                    total_amount: orderData.total,
                    status: "paid",
                    shipping_address: orderData.shippingAddress,
                    customer_email: orderData.customerEmail,
                    customer_name: orderData.customerName,
                    ffl_info: orderData.fflInfo,
                    transaction_id: transactionResponse.getTransId()
                  })
                  .select()
                  .single();

                if (orderError) throw orderError;

                const dbOrderItems = orderData.items.map((item: any) => ({
                  order_id: order.id,
                  product_id: item.id,
                  quantity: item.quantity,
                  price_at_time: item.price
                }));
                await supabase.from("order_items").insert(dbOrderItems);

                res.status(200).json({ success: true, transactionId: transactionResponse.getTransId() });
                resolve(null);
              } catch (dbError: any) {
                console.error("Database Error:", dbError);
                res.status(500).json({ error: "Payment successful but failed to save order." });
                resolve(null);
              }
            } else {
              const errorText = transactionResponse?.getErrors()?.getError()[0]?.getErrorText() || "Transaction Error";
              console.error("Transaction Error:", errorText);
              res.status(400).json({ error: errorText });
              resolve(null);
            }
          } else {
            const errorText = response.getMessages().getMessage()[0].getText();
            console.error("API Error:", errorText);
            res.status(400).json({ error: errorText });
            resolve(null);
          }
        } else {
          res.status(500).json({ error: "Null response from Authorize.net" });
          resolve(null);
        }
      });
    });
  } catch (error: any) {
    console.error("Authorize.net Error:", error);
    res.status(500).json({ error: error.message });
  }
}
