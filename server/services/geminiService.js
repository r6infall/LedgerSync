const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function getInsights(dataContext) {
  const client = getGenAI();
  if (!client) {
    return getMockInsights(dataContext);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are a GST compliance expert AI for Indian businesses. Analyze the following GST reconciliation data and provide actionable insights.

Business: ${dataContext.businessName || 'Unknown'}
GSTIN: ${dataContext.gstin || 'N/A'}
Total Invoices Analyzed: ${dataContext.totalInvoices}
Mismatches Found: ${dataContext.mismatches}
Missing Invoices: ${dataContext.missing}
Compliance Score: ${dataContext.complianceScore}/100
Risk Level: ${dataContext.riskLevel}
ITC at Risk: ₹${dataContext.itcAtRisk?.toLocaleString('en-IN') || 0}

User Question: ${dataContext.userQuestion}

Provide:
1. A brief health assessment (2-3 sentences)
2. Top 3 actionable recommendations
3. Risk mitigation steps if applicable

Format as JSON with keys: healthAssessment, recommendations (array of strings), riskSteps (array of strings).
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { healthAssessment: text, recommendations: [], riskSteps: [] };
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return getMockInsights(dataContext);
  }
}

async function explainMismatch(result) {
  const client = getGenAI();
  if (!client) {
    return getMockMismatchExplanation(result);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are a GST expert. Explain the following GST invoice mismatch in simple terms and suggest resolution steps.

Invoice ID: ${result.invoiceId?.invoiceNumber || 'N/A'}
Match Status: ${result.matchStatus}
Our Record Total: ₹${result.ourRecord?.totalAmount?.toFixed(2) || 0}
Portal Record Total: ₹${result.portalRecord?.totalAmount?.toFixed(2) || 0}
Difference: ₹${result.differenceAmount?.toFixed(2) || 0}
Confidence Score: ${result.confidenceScore}/100
Remarks: ${result.remarks}

Provide a clear explanation and 3 resolution steps. Format as JSON with keys: explanation, steps (array).
`;

    const r = await model.generateContent(prompt);
    const text = r.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { explanation: text, steps: [] };
  } catch (err) {
    return getMockMismatchExplanation(result);
  }
}

function getMockInsights(ctx) {
  return {
    healthAssessment: `Your GST compliance score is ${ctx.complianceScore}/100 with a ${ctx.riskLevel} risk level. You have ${ctx.mismatches} mismatches and ${ctx.missing} missing invoices that require immediate attention. Configure your Gemini API key to get personalized AI insights.`,
    recommendations: [
      'Cross-verify all mismatched invoices with your suppliers within 5 business days',
      'Ensure all purchase invoices are uploaded to GSTR-2A before the filing deadline',
      'Maintain a tolerance buffer of 1% for GST amount discrepancies'
    ],
    riskSteps: [
      `ITC of ₹${ctx.itcAtRisk?.toLocaleString('en-IN')} is at risk — prioritize resolving ${ctx.mismatches} mismatched invoices`,
      'File GSTR-3B on time to avoid interest charges of 18% p.a.',
      'Contact suppliers for missing invoices to ensure timely GSTR-1 filing'
    ]
  };
}

function getMockMismatchExplanation(result) {
  return {
    explanation: `This invoice shows a ${result.matchStatus} with a difference of ₹${result.differenceAmount?.toFixed(2)}. The discrepancy may be due to rounding differences, wrong HSN code, or a supplier filing error.`,
    steps: [
      'Contact the supplier to verify the correct invoice amount',
      'Check if the invoice was filed under the correct tax period',
      'If confirmed correct, raise a rectification request in the GST portal'
    ]
  };
}

module.exports = { getInsights, explainMismatch };
