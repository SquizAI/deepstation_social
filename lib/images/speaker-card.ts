import type { SpeakerForm, Speaker } from '@/lib/types/speakers'
import { createClient } from '@/lib/supabase/client'

export interface SpeakerCardDimensions {
  width: number
  height: number
}

export const PLATFORM_DIMENSIONS: Record<string, SpeakerCardDimensions> = {
  linkedin: { width: 1200, height: 627 },
  twitter: { width: 1200, height: 675 },
  instagram: { width: 1080, height: 1080 },
  discord: { width: 1920, height: 1080 }
}

// Format date for display on card
function formatDateForCard(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Normalize speaker data
function normalizeSpeakerData(data: SpeakerForm | Speaker): SpeakerForm {
  if ('fullName' in data) {
    return data
  }

  return {
    fullName: data.full_name,
    title: data.title,
    company: data.company,
    bio: data.bio,
    profilePhoto: data.profile_photo_url,
    linkedin: data.linkedin,
    twitter: data.twitter,
    instagram: data.instagram,
    website: data.website,
    presentationTitle: data.presentation_title,
    presentationDescription: data.presentation_description,
    presentationType: data.presentation_type,
    expertise: data.expertise,
    eventDate: new Date(data.event_date),
    eventLocation: data.event_location,
    highlights: data.highlights,
    previousCompanies: data.previous_companies
  }
}

/**
 * Generate HTML template for speaker card
 * This uses HTML/CSS that can be converted to an image using a service like:
 * - Puppeteer (for server-side generation)
 * - html2canvas (client-side)
 * - External service (Cloudinary, Imgix, etc.)
 */
export function generateSpeakerCardHTML(
  speakerData: SpeakerForm | Speaker,
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord'
): string {
  const data = normalizeSpeakerData(speakerData)
  const dimensions = PLATFORM_DIMENSIONS[platform]
  const formattedDate = formatDateForCard(data.eventDate)

  // Truncate presentation title if too long
  const maxTitleLength = platform === 'instagram' ? 80 : 100
  const displayTitle =
    data.presentationTitle.length > maxTitleLength
      ? data.presentationTitle.substring(0, maxTitleLength) + '...'
      : data.presentationTitle

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      overflow: hidden;
    }

    .card {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px;
      color: white;
    }

    .logo {
      position: absolute;
      top: 40px;
      left: 40px;
      font-size: 32px;
      font-weight: 700;
      color: white;
    }

    .speaker-photo {
      width: ${platform === 'instagram' ? '200px' : '180px'};
      height: ${platform === 'instagram' ? '200px' : '180px'};
      border-radius: 50%;
      object-fit: cover;
      border: 6px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 30px;
      background: #333;
    }

    .speaker-name {
      font-size: ${platform === 'instagram' ? '48px' : '42px'};
      font-weight: 700;
      text-align: center;
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .speaker-title {
      font-size: ${platform === 'instagram' ? '24px' : '22px'};
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      margin-bottom: 40px;
      line-height: 1.4;
    }

    .presentation-title {
      font-size: ${platform === 'instagram' ? '28px' : '26px'};
      font-weight: 600;
      text-align: center;
      margin-bottom: 30px;
      padding: 0 40px;
      line-height: 1.3;
      color: #60a5fa;
    }

    .event-details {
      display: flex;
      gap: 40px;
      font-size: ${platform === 'instagram' ? '20px' : '18px'};
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 30px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer {
      position: absolute;
      bottom: 40px;
      font-size: ${platform === 'instagram' ? '20px' : '18px'};
      color: rgba(255, 255, 255, 0.6);
    }

    .badge {
      position: absolute;
      top: 40px;
      right: 40px;
      background: rgba(96, 165, 250, 0.2);
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 16px;
      font-weight: 600;
      border: 2px solid rgba(96, 165, 250, 0.4);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">DeepStation</div>
    <div class="badge">${data.presentationType.toUpperCase()}</div>

    ${
      data.profilePhoto
        ? `<img src="${data.profilePhoto}" alt="${data.fullName}" class="speaker-photo" />`
        : `<div class="speaker-photo"></div>`
    }

    <div class="speaker-name">${data.fullName}</div>
    <div class="speaker-title">${data.title} at ${data.company}</div>
    <div class="presentation-title">"${displayTitle}"</div>

    <div class="event-details">
      <div class="detail-item">
        <span>📅</span>
        <span>${formattedDate}</span>
      </div>
      <div class="detail-item">
        <span>📍</span>
        <span>${data.eventLocation}</span>
      </div>
    </div>

    <div class="footer">deepstation.ai</div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Upload speaker card image to Supabase Storage
 */
export async function uploadSpeakerCardImage(
  imageBlob: Blob,
  speakerId: string,
  platform: string
): Promise<string> {
  const supabase = createClient()

  const fileName = `speaker-cards/${speakerId}/${platform}-${Date.now()}.png`

  const { data, error } = await supabase.storage
    .from('speaker-images')
    .upload(fileName, imageBlob, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload speaker card image: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl }
  } = supabase.storage.from('speaker-images').getPublicUrl(fileName)

  return publicUrl
}

/**
 * Client-side function to generate speaker card using html2canvas
 * Note: This requires html2canvas to be installed: npm install html2canvas
 */
export async function generateSpeakerCardClient(
  speakerData: SpeakerForm | Speaker,
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord'
): Promise<Blob> {
  // This is a placeholder - actual implementation would use html2canvas or similar
  // For now, we'll provide the HTML and instructions for integration

  const html = generateSpeakerCardHTML(speakerData, platform)

  // In a real implementation, you would:
  // 1. Create a temporary container
  // 2. Insert the HTML
  // 3. Use html2canvas to render it
  // 4. Convert canvas to blob
  // 5. Clean up

  // Example implementation (requires html2canvas):
  /*
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const canvas = await html2canvas(container.querySelector('.card'));

  document.body.removeChild(container);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
  */

  throw new Error(
    'Client-side image generation not implemented. Please use external service or server-side generation.'
  )
}

/**
 * Generate speaker cards for all platforms
 * Returns HTML templates that can be converted to images
 */
export function generateAllSpeakerCards(
  speakerData: SpeakerForm | Speaker
): Record<string, string> {
  return {
    linkedin: generateSpeakerCardHTML(speakerData, 'linkedin'),
    twitter: generateSpeakerCardHTML(speakerData, 'twitter'),
    instagram: generateSpeakerCardHTML(speakerData, 'instagram'),
    discord: generateSpeakerCardHTML(speakerData, 'discord')
  }
}

/**
 * Placeholder for external image generation service
 * You can integrate with services like:
 * - Cloudinary
 * - Imgix
 * - Vercel OG Image
 * - Puppeteer (server-side)
 */
export async function generateSpeakerCardExternal(
  speakerData: SpeakerForm | Speaker,
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord'
): Promise<string> {
  // This is where you would call an external service
  // Example with a hypothetical API:
  /*
  const html = generateSpeakerCardHTML(speakerData, platform);
  const response = await fetch('https://api.htmltoimage.com/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, width: dimensions.width, height: dimensions.height })
  });
  const { imageUrl } = await response.json();
  return imageUrl;
  */

  throw new Error('External image generation service not configured')
}
