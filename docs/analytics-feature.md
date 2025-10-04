# Analytics Dashboard

The Analytics Dashboard provides comprehensive insights into social media performance across all connected platforms.

## Features

### 1. Date Range Filtering
- **Presets**: Last 7 days, 30 days, 90 days
- **Custom Range**: Select any date range for analysis
- **Real-time Updates**: Data refreshes when filters change

### 2. Platform Filtering
- Filter by specific platform (LinkedIn, Instagram, Twitter, Discord)
- View all platforms combined
- Platform-specific metrics and comparisons

### 3. Key Metrics Cards
- **Total Posts**: Number of posts created in selected period
- **Total Engagement**: Sum of all interactions (likes, shares, comments)
- **Avg Engagement**: Average engagement per post
- **Success Rate**: Percentage of successfully published posts

### 4. Visualizations

#### Posts Over Time (Line Chart)
- Tracks post volume and engagement trends
- Helps identify posting patterns
- Shows engagement growth over time

#### Engagement by Platform (Bar Chart)
- Compares total engagement across platforms
- Color-coded by platform
- Identifies best performing platforms

#### Best Posting Times (Heatmap)
- Shows engagement levels by day and hour
- Identifies optimal posting times
- Based on historical performance data
- Minimum 2 posts per time slot for statistical relevance

#### Top Performing Posts (Table)
- Sortable by engagement metrics
- Shows post preview and platforms
- Displays individual metrics (likes, shares, comments)
- Success rate indicator

### 5. Export Functionality
- Download analytics data as CSV
- Includes summary, platform performance, top posts, and time series data
- Filename includes date range for easy organization

## Database Views

### post_analytics
Aggregates post metrics with engagement calculations:
- Total engagement across all platforms
- Individual metric totals (likes, shares, comments)
- Success rate per post
- Platform-specific results

### platform_performance
Platform-specific performance metrics:
- Post counts and success rates
- Engagement totals and averages
- Date range of activity

## Functions

### get_analytics_summary(user_id, platform, date_range_days)
Returns overall analytics summary including:
- Total and published posts
- Engagement metrics
- Success rate
- Most/least engaged platforms

### get_best_posting_times(user_id, platform, date_range_days)
Analyzes historical data to find optimal posting times:
- Returns day of week and hour combinations
- Includes average engagement and post count
- Requires minimum 2 posts per time slot

### get_top_posts(user_id, platform, date_range_days, limit)
Returns top performing posts by engagement:
- Sortable and filterable
- Includes full post details and metrics
- Default limit of 10 posts

## Usage

### Basic Usage
```typescript
import { AnalyticsClient } from '@/app/dashboard/analytics/analytics-client'

<AnalyticsClient userId={user.id} />
```

### Fetching Analytics Data
```typescript
import {
  fetchAnalyticsSummary,
  getDateRangeFromPreset
} from '@/lib/analytics/analytics-service'

const range = getDateRangeFromPreset('30d')
const summary = await fetchAnalyticsSummary(userId, range, 'linkedin')
```

### Exporting Data
```typescript
import { exportToCSV, downloadCSV } from '@/lib/analytics/analytics-service'

const csv = exportToCSV(exportData)
downloadCSV(csv, 'analytics-report.csv')
```

## Component Structure

```
app/dashboard/analytics/
├── page.tsx                    # Server component (auth check)
└── analytics-client.tsx        # Client component (main UI)

components/analytics/
├── bar-chart.tsx              # Platform comparison chart
├── line-chart.tsx             # Time series chart
├── heatmap.tsx                # Posting times heatmap
├── metrics-card.tsx           # Summary metric display
├── top-posts-table.tsx        # Top posts table
├── loading-skeleton.tsx       # Loading state
└── index.ts                   # Export barrel

lib/analytics/
├── analytics-service.ts       # Data fetching and processing
└── index.ts                   # Export barrel

lib/types/
└── analytics.ts               # TypeScript interfaces
```

## Performance Optimizations

1. **Database Indexes**
   - Optimized queries for date ranges
   - Platform-specific indexes
   - Composite indexes for common filters

2. **Data Aggregation**
   - Pre-aggregated views for common queries
   - Efficient joins between posts and results
   - Minimal data transfer to client

3. **Client-Side Caching**
   - State management with React hooks
   - Parallel data fetching with Promise.all
   - Optimistic UI updates

## Color Coding

Platform colors for consistent UI:
- LinkedIn: `#0A66C2` (Blue)
- Instagram: `#E4405F` (Pink)
- Twitter: `#1DA1F2` (Light Blue)
- Discord: `#5865F2` (Indigo)

## Future Enhancements

- Real-time analytics updates
- Comparative analytics (period over period)
- Predictive analytics with AI
- Custom metric calculations
- Scheduled analytics reports
- Advanced filtering (by content type, hashtags)
- Export to additional formats (PDF, Excel)
