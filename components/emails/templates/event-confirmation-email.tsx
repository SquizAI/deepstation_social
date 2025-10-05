import type { Event } from '@/lib/types/event'

interface EventConfirmationEmailProps {
  event: Event
  attendeeName: string
  registrationId: string
}

export function EventConfirmationEmail({
  event,
  attendeeName,
  registrationId,
}: EventConfirmationEmailProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

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
        <title>Event Registration Confirmed</title>
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
                {/* Header */}
                <tr>
                  <td style={{
                    background: 'linear-gradient(135deg, #d946ef 0%, #9333ea 100%)',
                    padding: '40px 30px',
                    textAlign: 'center',
                  }}>
                    <h1 style={{
                      color: '#ffffff',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      margin: 0,
                      marginBottom: '10px',
                    }}>
                      You're Registered! 🎉
                    </h1>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      margin: 0,
                    }}>
                      Get ready for an amazing experience
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
                      Thank you for registering for <strong style={{ color: '#ffffff' }}>{event.title}</strong>.
                      We're excited to have you join us!
                    </p>
                  </td>
                </tr>

                {/* Event Details Card */}
                <tr>
                  <td style={{ padding: '0 30px 30px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}>
                      <tr>
                        <td>
                          <h2 style={{
                            color: '#ffffff',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            margin: 0,
                            marginBottom: '20px',
                          }}>
                            📅 Event Details
                          </h2>

                          {/* Date */}
                          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '15px' }}>
                            <tr>
                              <td width="30%" style={{ verticalAlign: 'top' }}>
                                <p style={{
                                  color: '#94a3b8',
                                  fontSize: '14px',
                                  margin: 0,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}>
                                  Date
                                </p>
                              </td>
                              <td>
                                <p style={{
                                  color: '#ffffff',
                                  fontSize: '15px',
                                  margin: 0,
                                  fontWeight: '600',
                                }}>
                                  {formatDate(event.event_date)}
                                </p>
                              </td>
                            </tr>
                          </table>

                          {/* Time */}
                          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '15px' }}>
                            <tr>
                              <td width="30%" style={{ verticalAlign: 'top' }}>
                                <p style={{
                                  color: '#94a3b8',
                                  fontSize: '14px',
                                  margin: 0,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}>
                                  Time
                                </p>
                              </td>
                              <td>
                                <p style={{
                                  color: '#ffffff',
                                  fontSize: '15px',
                                  margin: 0,
                                  fontWeight: '600',
                                }}>
                                  {formatTime(event.start_time)} - {formatTime(event.end_time)} {event.timezone}
                                </p>
                              </td>
                            </tr>
                          </table>

                          {/* Location */}
                          <table width="100%" cellPadding="0" cellSpacing="0">
                            <tr>
                              <td width="30%" style={{ verticalAlign: 'top' }}>
                                <p style={{
                                  color: '#94a3b8',
                                  fontSize: '14px',
                                  margin: 0,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}>
                                  Location
                                </p>
                              </td>
                              <td>
                                <p style={{
                                  color: '#ffffff',
                                  fontSize: '15px',
                                  margin: 0,
                                  fontWeight: '600',
                                  textTransform: 'capitalize',
                                }}>
                                  {event.location_type}
                                </p>
                                {event.location_type === 'online' ? (
                                  <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '14px',
                                    margin: '5px 0 0 0',
                                  }}>
                                    Meeting link will be sent closer to the event date
                                  </p>
                                ) : (
                                  event.location_name && (
                                    <p style={{
                                      color: '#cbd5e1',
                                      fontSize: '14px',
                                      margin: '5px 0 0 0',
                                    }}>
                                      {event.location_name}
                                    </p>
                                  )
                                )}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* CTA Button */}
                <tr>
                  <td style={{ padding: '0 30px 30px', textAlign: 'center' }}>
                    <a href={`https://deepstation.ai/events/${event.slug}`} style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #d946ef 0%, #9333ea 100%)',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      padding: '16px 40px',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(217, 70, 239, 0.3)',
                    }}>
                      View Event Details
                    </a>
                  </td>
                </tr>

                {/* Registration ID */}
                <tr>
                  <td style={{ padding: '0 30px 30px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      backgroundColor: 'rgba(71, 85, 105, 0.2)',
                      borderRadius: '8px',
                      padding: '15px',
                    }}>
                      <tr>
                        <td>
                          <p style={{
                            color: '#94a3b8',
                            fontSize: '13px',
                            margin: 0,
                            marginBottom: '5px',
                          }}>
                            Registration ID
                          </p>
                          <p style={{
                            color: '#ffffff',
                            fontSize: '14px',
                            margin: 0,
                            fontFamily: 'monospace',
                          }}>
                            {registrationId}
                          </p>
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
                      Questions? Reply to this email or contact us at{' '}
                      <a href="mailto:events@deepstation.ai" style={{ color: '#d946ef', textDecoration: 'none' }}>
                        events@deepstation.ai
                      </a>
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
