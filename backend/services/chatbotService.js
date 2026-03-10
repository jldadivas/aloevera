const axios = require('axios');

class ChatbotService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    // Use gemini-2.5-flash - available and supports generateContent on free tier
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
  }

  // Comprehensive Aloe Vera knowledge base for free responses
  getAloeVeraResponse(userMessage) {
    const lower = userMessage.toLowerCase();
    
    const responses = {
      care: `🌱 **Aloe Vera Complete Care Guide:**
**Sunlight:** 6-8 hours of bright, indirect sunlight daily
**Watering:** Water deeply but infrequently. Let soil dry completely between waterings (every 2-3 weeks)
**Soil:** Use well-draining cactus or succulent soil mix
**Temperature:** Prefers 50-85°F (10-29°C). Protect from frost
**Humidity:** Low humidity is ideal - avoid misting
**Pot:** Must have drainage holes to prevent root rot
**Repotting:** Repot every 2-3 years in spring
**Fertilizer:** Feed sparingly in growing season (spring/summer) with diluted succulent fertilizer`,

      water: `💧 **Complete Watering Guide for Aloe Vera:**
The golden rule: Less water is better than more!
- Water thoroughly but allow soil to dry out COMPLETELY between waterings
- In summer: Water every 2-3 weeks
- In winter: Water only once a month or less
- Signs of overwatering: Transparent/mushy leaves, soft base, root rot smell
- Signs of underwatering: Shriveled or wrinkled leaves
- IMPORTANT: Always use well-draining soil mixed with perlite or sand
- Empty any water sitting in the pot after 10 minutes to prevent root rot
- When in doubt, wait longer - it prefers dry conditions`,

      benefits: `💚 **Aloe Vera Health & Wellness Benefits:**

**Skin Care:**
- Soothes sunburns and reduces redness
- Moisturizes skin without clogging pores
- May reduce acne due to antibacterial properties
- Anti-aging properties from antioxidants
- Promotes wound healing

**Digestive Health:**
- Contains compounds that may aid digestion
- Traditionally used as a natural laxative
- May soothe digestive inflammation

**General Health:**
- Anti-inflammatory properties
- Rich in vitamins A, C, E and minerals
- Contains amino acids and polysaccharides
- May boost immune system

⚠️ **IMPORTANT CAUTIONS:**
- Always consult healthcare professionals before internal use
- Never ingest the yellow latex (very strong laxative)
- Use only the clear gel for consumption
- May interact with certain medications
- Not recommended during pregnancy`,

      propagation: `🌿 **How to Propagate Aloe Vera:**

**Method 1: From Pups (Baby Plants) - EASIEST:**
1. Wait for pups to grow 3-4 inches tall with their own roots
2. Gently pull or cut pups away from mother plant
3. Let cuts dry for 2-3 days in shade
4. Plant pups in cactus soil mixture
5. Do NOT water for 1-2 weeks to prevent rot
6. Water lightly, then return to normal watering schedule
7. Place in bright, indirect light
8. Should root within 3-4 weeks

**Method 2: From Leaf Cuttings:**
1. Cut healthy outer leaves at the base with a sharp knife
2. Let cuts dry completely for 3-5 days
3. Plant in cactus/succulent soil
4. Keep soil slightly moist (not wet)
5. Place in warm location with bright light
6. Roots will develop in 2-3 weeks
7. Once rooted, switch to normal succulent watering

**Tips:**
- Propagation is easiest in spring/summer
- Don't overwater during rooting - this causes rot
- Be patient - rooting takes 3-4 weeks
- Use well-draining soil exclusively`,

      problems: `🆘 **Troubleshooting Common Aloe Vera Problems:**

**Brown or Black Spots:**
- Usually indicates fungal infection
- Often from overwatering or poor drainage
- Solution: Reduce watering, improve drainage, remove affected leaves

**Yellow Leaves:**
- Most common cause: Overwatering
- Poor drainage issues
- Solution: Let soil dry completely, repot with better drainage

**Mushy/Translucent Leaves:**
- Sign of root rot from excess moisture
- Serious condition - act immediately
- Solution: Remove from pot, trim rotted roots, repot in dry soil

**Pale or Faded Color:**
- Needs more sunlight
- Solution: Move to brighter location with more direct sun

**Pest Issues (Rare):**
- Mealybugs or spider mites occasionally attack
- Solution: Spray with neem oil or insecticidal soap

**Leggy Growth (Tall and Thin):**
- Insufficient light
- Solution: Move closer to bright window or grow light

**Wilting Despite Moist Soil:**
- Still root rot - check roots immediately
- Solution: Repot in fresh, dry soil`,

      harvest: `✂️ **How to Harvest Aloe Vera Gel Safely:**

**When to Harvest:**
- Wait until plant is at least 3 years old and mature
- Only harvest when leaves are thick and full

**How to Harvest:**
1. Choose outer leaves (older, larger leaves)
2. Cut leaves near the base with a clean knife
3. Let the plant drip red sap for several minutes (contains bitter compounds)
4. Scoop out the clear, transparent gel with a spoon
5. Discard the yellow latex layer and thick skin

**Storage:**
- Use gel immediately for best results
- Store leftover gel in refrigerator in airtight container
- Lasts 1-2 weeks refrigerated
- Can freeze in ice cube trays for longer storage (up to 3 months)

**Uses of Harvested Gel:**
- Apply directly to skin for sunburns, cuts, minor wounds
- Use in face masks for skincare
- Add to smoothies for internal benefits (consult doctor first)
- Mix with lotions and creams

**Plant Care After Harvest:**
- The plant will recover and grow new leaves
- Reduce watering for a few weeks after harvest
- Let it rest before harvesting again`,

      diseases: `🦠 **Common Aloe Vera Diseases & Solutions:**

**Root Rot (Most Common):**
- Cause: Overwatering, poor drainage
- Signs: Mushy leaves, foul smell, plant collapse
- Solution: Repot immediately in fresh, dry soil with better drainage

**Fungal Infections:**
- Brown or black spots on leaves
- Cause: High humidity, wet leaves, poor air circulation
- Solution: Remove affected leaves, improve air flow, reduce watering

**Bacterial Infections (Rare):**
- Yellow-brown watery lesions
- Cause: Overwatering in cool temperature
- Solution: Very difficult to treat, may need to remove affected tissue

**Pest Infestations:**
- Mealybugs (cotton-like clusters)
- Spider mites (tiny dots, webbing)
- Solution: Spray with neem oil every 7-10 days`,

      light: `☀️ **Aloe Vera Lighting Requirements:**

**Ideal Light Conditions:**
- 6-8 hours of bright light daily
- Indirect sunlight (filtered through window preferred)
- Can tolerate some direct sun but may turn reddish/brown (not harmful)

**Outdoor Growing:**
- Place in bright spot with morning sun
- Afternoon shade in very hot climates (over 90°F)
- Full sun is acceptable in temperate climates

**Indoor Growing:**
- Place near south or west-facing window
- 2-3 feet from window for bright, indirect light
- Can grow under LED grow lights if natural light is insufficient

**Winter Light:**
- Ensure maximum light exposure
- Move closer to brightest window
- Reduce watering in low-light winter months

**Too Little Light Signs:**
- Plant becomes pale or yellowish
- Leaves stretch toward light source
- Growth slows significantly

**Too Much Direct Sun:**
- Leaves may turn reddish or brown
- This doesn't harm the plant but indicates excessive sun`,
    };

    // Find best matching response
    for (const [key, response] of Object.entries(responses)) {
      if (lower.includes(key) || 
          (key === 'benefits' && lower.includes('benefit')) ||
          (key === 'propagation' && (lower.includes('propagat') || lower.includes('grow') || lower.includes('baby'))) ||
          (key === 'water' && (lower.includes('water') || lower.includes('moist') || lower.includes('drought'))) ||
          (key === 'problems' && (lower.includes('problem') || lower.includes('issue') || lower.includes('sick') || lower.includes('yellow') || lower.includes('brown'))) ||
          (key === 'diseases' && (lower.includes('disease') || lower.includes('rot') || lower.includes('fungal'))) ||
          (key === 'light' && (lower.includes('light') || lower.includes('sun') || lower.includes('bright')))) {
        return response;
      }
    }

    // Default comprehensive response
    return `🌿 **Welcome to Aloe Vera Assistant!**

I'm your free guide to all things Aloe Vera. I can help you with:

📚 **Topics I Know Well:**
- **Care** - sunlight, watering, temperature, humidity, soil
- **Watering** - schedules, frequency, signs of over/underwatering
- **Health Benefits** - skin care, wellness uses, precautions
- **Propagation** - growing new plants from pups or leaves
- **Harvesting** - how and when to harvest gel safely
- **Problems** - troubleshooting yellow leaves, rot, pests
- **Diseases** - identifying and treating common issues
- **Light** - optimal lighting for healthy growth

Try asking about: "How do I care for Aloe Vera?", "Why are my leaves turning yellow?", "How do I propagate?", "What are the health benefits?", or "How do I harvest the gel?"

What would you like to know about Aloe Vera? 🌱`;
  }

  async chat(userMessage) {
    if (!this.apiKey) {
      return this.getAloeVeraResponse(userMessage);
    }

    try {
      // Use REST API directly for free tier compatibility
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `You are an expert Aloe Vera botanical assistant. Answer ONLY about Aloe Vera topics. Be helpful, concise, and practical. If the question is not about Aloe Vera, politely redirect to Aloe Vera topics.\n\nUser question: ${userMessage}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const botResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (botResponse) {
        console.log('✓ Using Gemini API for response');
        return botResponse;
      }
      
      return this.getAloeVeraResponse(userMessage);
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data?.error?.message || error.message);
      
      // Fall back to local knowledge base on any API error
      console.log('Falling back to local knowledge base');
      return this.getAloeVeraResponse(userMessage);
    }
  }
}

module.exports = new ChatbotService();
