const OpenAI = require('openai');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Downloaded: ${filepath}`);
          resolve();
        });
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
};

const generateImages = async () => {
  try {
    console.log('🎨 Generating DeepStation images with DALL-E...\n');

    // Hero Image - Wide banner for README
    console.log('📸 Generating hero image (1792×1024)...');
    const heroPrompt = `Create a modern, professional banner image for a social media automation platform called "DeepStation".
    Design specifications:
    - Wide horizontal banner format
    - Clean, modern gradient background in blue (#6366f1) to purple (#8b5cf6)
    - Include the text "DeepStation" in large, bold, modern sans-serif font
    - Subtitle: "AI-Powered Social Media Automation"
    - Include minimalist icons representing LinkedIn, Instagram, X (Twitter), and Discord
    - Professional tech aesthetic with subtle geometric patterns
    - High contrast text for readability
    - Modern, clean design suitable for GitHub README
    - No people, just clean iconography and text`;

    const heroResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: heroPrompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "vivid"
    });

    const heroUrl = heroResponse.data[0].url;
    const heroPath = path.join(__dirname, '../docs/images/hero.png');
    await downloadImage(heroUrl, heroPath);

    console.log('\n📱 Generating OG/SEO image (1024×1024)...');
    const ogPrompt = `Create a square social media preview image for "DeepStation" - an AI-powered social media automation platform.
    Design specifications:
    - Square format optimized for social media
    - Modern gradient background in blue to purple
    - Large, bold "DeepStation" text at top
    - Icons for LinkedIn, Instagram, X (Twitter), Discord arranged attractively
    - Text: "Automate Your Social Media" as tagline
    - Clean, professional design
    - High contrast and readable at small sizes
    - Modern tech aesthetic
    - Suitable for Twitter, LinkedIn, Facebook previews`;

    const ogResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: ogPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid"
    });

    const ogUrl = ogResponse.data[0].url;
    const ogPath = path.join(__dirname, '../public/og-image.png');

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    await downloadImage(ogUrl, ogPath);

    console.log('\n✨ Image generation complete!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${heroPath}`);
    console.log(`   - ${ogPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review the images');
    console.log('   2. Uncomment the hero image line in README.md');
    console.log('   3. Add OG image metadata to your Next.js app');
    console.log('   4. Upload github-social image to GitHub repo settings\n');

  } catch (error) {
    console.error('❌ Error generating images:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
};

generateImages();
