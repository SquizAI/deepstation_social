import type { Event } from '@/lib/types/event'

interface EventReminderEmailProps {
  event: Event
  attendeeName: string
  hoursUntilEvent: number
}

export function EventReminderEmail({
  event,
  attendeeName,
  hoursUntilEvent,
}: EventReminderEmailProps) {
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Event Reminder</title>
      </head>
      <body style={{
        backgroundColor: '#0a0513',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: 0,
        padding: 0,
      }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#0a0513', padding: '40px 20px' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding="0" cellSpacing="0" style={{
                backgroundColor: '#15092b',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}>
                {/* Header with urgency */}
                <tr>
                  <td style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    padding: '40px 30px',
                    textAlign: 'center',
                  }}>
                    <h1 style={{
                      color: '#ffffff',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      margin: 0,
                      marginBottom: '10px',
                    }}>
                      Starting Soon! ⏰
                    </h1>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '20px',
                      margin: 0,
                      fontWeight: '600',
                    }}>
                      Only {hoursUntilEvent} {hoursUntilEvent === 1 ? 'hour' : 'hours'} away
                    </p>
                  </td>
                </tr>

                {/* Greeting */}
                <tr>
                  <td style={{ padding: '30px' }}>
                    <p style={{
                      color: '#ffffff',
                      fontSize: '18px',
                      lineHeight: '1.6',
                      margin: 0,
                      marginBottom: '20px',
                    }}>
                      Hi {attendeeName},
                    </p>
                    <p style={{
                      color: '#cbd5e1',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      This is your friendly reminder that <strong style={{ color: '#ffffff' }}>{event.title}</strong> is coming up soon!
                    </p>
                  </td>
                </tr>

                {/* Countdown Card */}
                <tr>
                  <td style={{ padding: '0 30px 30px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                      border: '1px solid rgba(217, 70, 239, 0.3)',
                      borderRadius: '12px',
                      padding: '25px',
                      textAlign: 'center',
                    }}>
                      <tr>
                        <td>
                          <p style={{
                            color: '#94a3b8',
                            fontSize: '13px',
                            margin: 0,
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}>
                            Event Starts In
                          </p>
                          <p style={{
                            color: '#ffffff',
                            fontSize: '48px',
                            fontWeight: 'bold',
                            margin: 0,
                            background: 'linear-gradient(135deg, #d946ef 0%, #9333ea 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: '1.2',
                          }}>
                            {hoursUntilEvent}
                          </p>
                          <p style={{
                            color: '#cbd5e1',
                            fontSize: '16px',
                            margin: 0,
                            marginTop: '5px',
                          }}>
                            {hoursUntilEvent === 1 ? 'Hour' : 'Hours'}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Quick Access Info */}
                <tr>
                  <td style={{ padding: '0 30px 30px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      backgroundColor: 'rgba(71, 85, 105, 0.2)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}>
                      <tr>
                        <td>
                          <h3 style={{
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: 0,
                            marginBottom: '15px',
                          }}>
                            📌 Quick Details
                          </h3>

                          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '10px' }}>
                            <tr>
                              <td width="35%">
                                <p style={{
                                  color: '#94a3b8',
                                  fontSize: '14px',
                                  margin: 0,
                                }}>
                                  Time
                                </p>
                              </td>
                              <td>
                                <p style={{
                                  color: '#ffffff',
                                  fontSize: '14px',
                                  margin: 0,
                                  fontWeight: '500',
                                }}>
                                  {formatTime(event.start_time)} {event.timezone}
                                </p>
                              </td>
                            </tr>
                          </table>

                          {event.location_type === 'online' && event.meeting_url && (
                            <table width="100%" cellPadding="0" cellSpacing="0">
                              <tr>
                                <td width="35%">
                                  <p style={{
                                    color: '#94a3b8',
                                    fontSize: '14px',
                                    margin: 0,
                                  }}>
                                    Join URL
                                  </p>
                                </td>
                                <td>
                                  <a href={event.meeting_url} style={{
                                    color: '#d946ef',
                                    fontSize: '14px',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                  }}>
                                    Click to Join
                                  </a>
                                </td>
                              </tr>
                            </table>
                          )}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* CTA Button */}
                <tr>
                  <td style={{ padding: '0 30px 30px', textAlign: 'center' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td style={{ paddingBottom: '15px' }}>
                          <a href={event.location_type === 'online' && event.meeting_url ? event.meeting_url : `https://deepstation.ai/events/${event.slug}`} style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #d946ef 0%, #9333ea 100%)',
                            color: '#ffffff',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            padding: '18px 50px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(217, 70, 239, 0.4)',
                          }}>
                            {event.location_type === 'online' ? '🎥 Join Event' : '📍 View Location'}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <a href={`https://deepstation.ai/events/${event.slug}`} style={{
                            color: '#cbd5e1',
                            fontSize: '14px',
                            textDecoration: 'none',
                          }}>
                            View Event Details →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Preparation Checklist */}
                <tr>
                  <td style={{ padding: '0 30px 30px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}>
                      <tr>
                        <td>
                          <h3 style={{
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: 0,
                            marginBottom: '15px',
                          }}>
                            ✅ Pre-Event Checklist
                          </h3>
                          <ul style={{
                            color: '#cbd5e1',
                            fontSize: '14px',
                            lineHeight: '1.8',
                            margin: 0,
                            paddingLeft: '20px',
                          }}>
                            <li>Have your device fully charged</li>
                            {event.location_type === 'online' && (
                              <>
                                <li>Test your internet connection</li>
                                <li>Find a quiet space with good lighting</li>
                                <li>Prepare any questions you'd like to ask</li>
                              </>
                            )}
                            {event.location_type !== 'online' && (
                              <>
                                <li>Check the venue location and parking</li>
                                <li>Bring your ID if required</li>
                                <li>Arrive 15 minutes early for check-in</li>
                              </>
                            )}
                          </ul>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{
                    padding: '30px',
                    borderTop: '1px solid rgba(168, 85, 247, 0.2)',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      color: '#94a3b8',
                      fontSize: '14px',
                      margin: 0,
                      marginBottom: '10px',
                    }}>
                      See you soon! 👋
                    </p>
                    <p style={{
                      color: '#64748b',
                      fontSize: '12px',
                      margin: 0,
                    }}>
                      © 2025 DeepStation. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
