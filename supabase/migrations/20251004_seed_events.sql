-- Seed some test events for the homepage calendar
-- This migration adds 3 upcoming published events

INSERT INTO events (
  title,
  slug,
  short_description,
  full_description,
  event_date,
  start_time,
  end_time,
  timezone,
  location_type,
  meeting_url,
  max_capacity,
  is_free,
  allow_waitlist,
  status,
  created_by,
  current_attendees,
  tags
) VALUES
(
  'AI & Machine Learning Workshop',
  'ai-machine-learning-workshop',
  'Join us for an intensive hands-on workshop covering the latest AI and ML techniques',
  'This comprehensive workshop will cover cutting-edge AI and machine learning techniques, with hands-on exercises and real-world examples. Perfect for developers looking to enhance their AI skills.

Topics covered:
- Introduction to Neural Networks
- Deep Learning Frameworks (TensorFlow, PyTorch)
- Natural Language Processing
- Computer Vision
- Practical AI Applications

You will leave with practical knowledge and code examples you can use immediately in your projects.',
  '2025-10-15',
  '09:00',
  '17:00',
  'America/New_York',
  'online',
  'https://zoom.us/j/ai-ml-workshop',
  100,
  true,
  true,
  'published',
  (SELECT id FROM auth.users LIMIT 1),
  23,
  ARRAY['AI', 'Machine Learning', 'Workshop', 'Technology']
),
(
  'Social Media Automation Masterclass',
  'social-media-automation-masterclass',
  'Learn how to automate your entire social media workflow with DeepStation',
  'Master the art of social media automation in this comprehensive masterclass. Learn how to leverage AI-powered tools to create, schedule, and optimize content across all major platforms.

What you will learn:
- Setting up automated content workflows
- AI-powered content generation
- Multi-platform scheduling strategies
- Analytics and performance optimization
- Advanced automation techniques

This masterclass is perfect for marketers, content creators, and business owners looking to scale their social media presence.',
  '2025-11-08',
  '14:00',
  '18:00',
  'America/New_York',
  'hybrid',
  'https://zoom.us/j/social-automation',
  50,
  false,
  true,
  'published',
  (SELECT id FROM auth.users LIMIT 1),
  37,
  ARRAY['Social Media', 'Automation', 'Marketing', 'Content Creation']
),
(
  'Building AI Workflows: From Idea to Production',
  'building-ai-workflows',
  'A hands-on session on designing and deploying production-ready AI automation workflows',
  'Take your automation skills to the next level by learning how to design, build, and deploy production-ready AI workflows.

Workshop agenda:
- Workflow design principles
- Integrating AI services (GPT-5, Claude, Gemini)
- Error handling and monitoring
- Scaling workflows
- Best practices and patterns
- Live coding session

Bring your laptop and be ready to build! We will provide starter templates and code examples. Perfect for developers and technical product managers.',
  '2025-12-03',
  '10:00',
  '16:00',
  'America/New_York',
  'online',
  'https://zoom.us/j/ai-workflows-prod',
  75,
  true,
  true,
  'published',
  (SELECT id FROM auth.users LIMIT 1),
  12,
  ARRAY['AI', 'Workflows', 'Automation', 'Development']
);
