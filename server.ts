import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import AuthorizeNet from "authorizenet";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Authorize.net Configuration
  const apiLoginId = process.env.AUTHORIZENET_API_LOGIN_ID;
  const transactionKey = process.env.AUTHORIZENET_TRANSACTION_KEY;

  app.use(express.json());

  // Authorize.net Payment Processing
  app.post("/api/process-payment", async (req, res) => {
    const { opaqueData, orderData } = req.body;

    if (!apiLoginId || !transactionKey) {
      return res.status(500).json({ error: "Authorize.net is not configured." });
    }

    try {
      const merchantAuthenticationType = new AuthorizeNet.APIContracts.MerchantAuthenticationType();
      merchantAuthenticationType.setApiLoginId(apiLoginId);
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
      const lineItems: AuthorizeNet.APIContracts.LineItemType[] = orderData.items.map((item: any, index: number) => {
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

      ctrl.execute(async () => {
        const apiResponse = ctrl.getResponse();
        const response = new AuthorizeNet.APIContracts.CreateTransactionResponse(apiResponse);

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

                res.json({ success: true, transactionId: transactionResponse.getTransId() });
              } catch (dbError: any) {
                console.error("Database Error:", dbError);
                res.status(500).json({ error: "Payment successful but failed to save order." });
              }
            } else {
              console.error("Transaction Error:", transactionResponse.getErrors().getError()[0].getErrorText());
              res.status(400).json({ error: transactionResponse.getErrors().getError()[0].getErrorText() });
            }
          } else {
            console.error("API Error:", response.getMessages().getMessage()[0].getText());
            res.status(400).json({ error: response.getMessages().getMessage()[0].getText() });
          }
        } else {
          res.status(500).json({ error: "Null response from Authorize.net" });
        }
      });
    } catch (error: any) {
      console.error("Authorize.net Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for scraping
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const html = await response.text();
      // Basic cleanup to reduce token count
      const cleanHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
        .replace(/<[^>]*>?/gm, " ") // Replace tags with spaces
        .replace(/\s+/g, " ") // Collapse whitespace
        .trim();
      
      res.json({ text: cleanHtml.substring(0, 10000) }); // Limit to 10k chars
    } catch (error: any) {
      console.error("Scrape Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session (DEPRECATED - Use Authorize.net)
  app.post("/api/create-checkout-session", async (req, res) => {
    res.status(410).json({ error: "Stripe is no longer supported for firearms. Use Authorize.net." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
