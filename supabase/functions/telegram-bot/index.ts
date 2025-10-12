import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}

async function sendTelegramDocument(chatId: number, pdfBuffer: Uint8Array, filename: string, caption: string) {
  try {
    const formData = new FormData();
    formData.append("chat_id", chatId.toString());
    formData.append("document", new Blob([pdfBuffer], { type: "application/pdf" }), filename);
    formData.append("caption", caption);

    const response = await fetch(`${TELEGRAM_API}/sendDocument`, {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error sending Telegram document:", error);
    throw error;
  }
}

function parseCommand(text: string): { party: string; customer: string; status: string } | null {
  const lowerText = text.toLowerCase();
  
  const patterns = [
    /report.*?party[:\s]+([^,]+).*?customer[:\s]+([^,]+).*?(satisfactory|unsatisfactory)/i,
    /banao.*?party[:\s]+([^,]+).*?customer[:\s]+([^,]+).*?(satisfactory|unsatisfactory)/i,
    /create.*?party[:\s]+([^,]+).*?customer[:\s]+([^,]+).*?(satisfactory|unsatisfactory)/i,
    /([^,]+)\s*[-,]\s*([^,]+)\s*[-,]\s*(satisfactory|unsatisfactory)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        party: match[1].trim(),
        customer: match[2].trim(),
        status: match[3].toLowerCase(),
      };
    }
  }

  return null;
}

async function generateSatisfactoryReport(party: string, customer: string) {
  try {
    const sampleCode = `SAMPLE-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .insert({
        sample_code: sampleCode,
        sample_type: "Beef",
        source: party,
        collection_date: today,
        received_date: today,
        status: "completed",
      })
      .select()
      .single();

    if (sampleError || !sample) {
      throw new Error(`Sample creation failed: ${sampleError?.message}`);
    }

    const { error: testError } = await supabase
      .from("test_results")
      .insert({
        sample_id: sample.id,
        tpc: 50000,
        coliforms: "negative",
        ecoli_o157: "negative",
        salmonella: "negative",
        s_aureus: "50",
        remarks: "Satisfactory",
      });

    if (testError) {
      throw new Error(`Test result creation failed: ${testError.message}`);
    }

    return {
      sampleCode,
      party,
      customer,
      status: "Satisfactory",
    };
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const update: TelegramUpdate = await req.json();

    if (!update.message || !update.message.text) {
      return new Response(
        JSON.stringify({ ok: true, message: "No text message" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text;

    if (text === "/start" || text === "/help") {
      const helpText = `🤖 *Meat Report Bot*\n\nCommands:\n\n/start - Show this help message\n/help - Show this help message\n\nTo create a report, send a message like:\n\n*Example 1:*\n\`Report banao - Party: ABC Foods, Customer: Ali Ahmed, Satisfactory\`\n\n*Example 2:*\n\`ABC Foods - Ali Ahmed - Satisfactory\`\n\n*Status options:*\n- Satisfactory\n- Unsatisfactory`;
      
      await sendTelegramMessage(chatId, helpText);
      
      return new Response(
        JSON.stringify({ ok: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const parsed = parseCommand(text);

    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        "❌ Command not understood.\n\nPlease use format:\n\`Party: ABC Foods, Customer: Ali Ahmed, Satisfactory\`\n\nOr send /help for more info."
      );
      
      return new Response(
        JSON.stringify({ ok: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await sendTelegramMessage(
      chatId,
      `⏳ Creating report...\n\nParty: ${parsed.party}\nCustomer: ${parsed.customer}\nStatus: ${parsed.status}`
    );

    if (parsed.status === "satisfactory") {
      const report = await generateSatisfactoryReport(parsed.party, parsed.customer);
      
      const successMessage = `✅ *Report Created!*\n\nSample Code: \`${report.sampleCode}\`\nParty: ${report.party}\nCustomer: ${report.customer}\nStatus: ${report.status}\n\n📊 All tests passed with satisfactory results.`;
      
      await sendTelegramMessage(chatId, successMessage);
    } else {
      await sendTelegramMessage(
        chatId,
        "⚠️ Unsatisfactory reports require manual creation through the web app for accuracy."
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing Telegram update:", error);
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});