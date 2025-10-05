'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Platform } from '@/lib/types/oauth'

interface PlatformAccount {
  platform: Platform
  isConnected: boolean
  providerUserId?: string
  expiresAt?: string
  isExpired?: boolean
  daysUntilExpiration?: number
}

interface AccountsResponse {
  userId: string
  accounts: PlatformAccount[]
}

interface PlatformConfig {
  name: string
  icon: string
  color: string
  gradient: string
  bgColor: string
  textColor: string
  description: string
  scopes: string[]
  docsUrl: string
  developerUrl: string
  credentialFields: {
    name: string
    label: string
    placeholder: string
    type: string
    helpText: string
  }[]
}

const platformConfigs: Record<Platform, PlatformConfig> = {
  linkedin: {
    name: 'LinkedIn',
    icon: '🔗',
    color: 'bg-[#0A66C2]',
    gradient: 'from-[#0A66C2] to-[#004182]',
    bgColor: 'bg-blue-50/50',
    textColor: 'text-[#0A66C2]',
    description: 'Share professional updates and engage with your network',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication',
    developerUrl: 'https://www.linkedin.com/developers/apps',
    credentialFields: [
      {
        name: 'clientId',
        label: 'Client ID',
        placeholder: 'Enter your LinkedIn Client ID',
        type: 'text',
        helpText: 'Found in your LinkedIn app settings under "Auth" tab'
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        placeholder: 'Enter your LinkedIn Client Secret',
        type: 'password',
        helpText: 'Found in your LinkedIn app settings under "Auth" tab'
      }
    ]
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
    gradient: 'from-purple-600 via-pink-600 to-orange-500',
    bgColor: 'bg-pink-50/50',
    textColor: 'text-pink-600',
    description: 'Post photos and stories to your Instagram feed',
    scopes: ['instagram_basic', 'instagram_content_publish'],
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    developerUrl: 'https://developers.facebook.com/apps',
    credentialFields: [
      {
        name: 'appId',
        label: 'App ID',
        placeholder: 'Enter your Instagram App ID',
        type: 'text',
        helpText: 'Found in your Facebook App dashboard'
      },
      {
        name: 'appSecret',
        label: 'App Secret',
        placeholder: 'Enter your Instagram App Secret',
        type: 'password',
        helpText: 'Found in your Facebook App settings under "Basic"'
      },
      {
        name: 'accessToken',
        label: 'User Access Token',
        placeholder: 'Enter your Instagram User Access Token',
        type: 'password',
        helpText: 'Long-lived access token for your Instagram Business account'
      }
    ]
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'bg-black',
    gradient: 'from-gray-900 to-black',
    bgColor: 'bg-gray-50/50',
    textColor: 'text-black',
    description: 'Post tweets and engage with your X audience',
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
    docsUrl: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0',
    developerUrl: 'https://developer.twitter.com/en/portal/dashboard',
    credentialFields: [
      {
        name: 'clientId',
        label: 'Client ID',
        placeholder: 'Enter your X API Client ID',
        type: 'text',
        helpText: 'Found in your X Developer Portal app settings'
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        placeholder: 'Enter your X API Client Secret',
        type: 'password',
        helpText: 'Found in your X Developer Portal app settings'
      },
      {
        name: 'bearerToken',
        label: 'Bearer Token',
        placeholder: 'Enter your X API Bearer Token',
        type: 'password',
        helpText: 'App-only authentication token from X Developer Portal'
      }
    ]
  },
  discord: {
    name: 'Discord',
    icon: '💬',
    color: 'bg-[#5865F2]',
    gradient: 'from-[#5865F2] to-[#4752C4]',
    bgColor: 'bg-indigo-50/50',
    textColor: 'text-[#5865F2]',
    description: 'Post announcements to your Discord server',
    scopes: ['identify', 'guilds', 'webhook.incoming'],
    docsUrl: 'https://discord.com/developers/docs/topics/oauth2',
    developerUrl: 'https://discord.com/developers/applications',
    credentialFields: [
      {
        name: 'clientId',
        label: 'Client ID',
        placeholder: 'Enter your Discord Client ID',
        type: 'text',
        helpText: 'Found in your Discord application settings'
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        placeholder: 'Enter your Discord Client Secret',
        type: 'password',
        helpText: 'Found in your Discord application OAuth2 settings'
      },
      {
        name: 'webhookUrl',
        label: 'Webhook URL (Optional)',
        placeholder: 'https://discord.com/api/webhooks/...',
        type: 'text',
        helpText: 'Direct webhook URL for posting to a specific channel'
      }
    ]
  },
  resend: {
    name: 'Resend',
    icon: '📧',
    color: 'bg-black',
    gradient: 'from-gray-800 to-black',
    bgColor: 'bg-gray-50/50',
    textColor: 'text-black',
    description: 'Send transactional emails and campaigns with Resend',
    scopes: ['email.send'],
    docsUrl: 'https://resend.com/docs/introduction',
    developerUrl: 'https://resend.com/api-keys',
    credentialFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        placeholder: 'Enter your Resend API Key (re_...)',
        type: 'password',
        helpText: 'Get this from your Resend dashboard > API Keys'
      },
      {
        name: 'fromEmail',
        label: 'From Email',
        placeholder: 'noreply@yourdomain.com',
        type: 'text',
        helpText: 'The email address to send from (must be verified in Resend)'
      },
      {
        name: 'fromName',
        label: 'From Name (Optional)',
        placeholder: 'Your Company Name',
        type: 'text',
        helpText: 'Display name for outgoing emails'
      }
    ]
  },
  sendgrid: {
    name: 'SendGrid',
    icon: '✉️',
    color: 'bg-[#1A82E2]',
    gradient: 'from-[#1A82E2] to-[#0B5FAB]',
    bgColor: 'bg-blue-50/50',
    textColor: 'text-[#1A82E2]',
    description: 'Send emails and newsletters with SendGrid',
    scopes: ['mail.send'],
    docsUrl: 'https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication',
    developerUrl: 'https://app.sendgrid.com/settings/api_keys',
    credentialFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        placeholder: 'Enter your SendGrid API Key (SG....)',
        type: 'password',
        helpText: 'Get this from SendGrid Settings > API Keys'
      },
      {
        name: 'fromEmail',
        label: 'From Email',
        placeholder: 'noreply@yourdomain.com',
        type: 'text',
        helpText: 'The email address to send from (must be verified in SendGrid)'
      },
      {
        name: 'fromName',
        label: 'From Name (Optional)',
        placeholder: 'Your Company Name',
        type: 'text',
        helpText: 'Display name for outgoing emails'
      }
    ]
  }
}

export default function SocialCredentialsPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null)
  const [disconnectDialog, setDisconnectDialog] = useState<Platform | null>(null)
  const [credentialsDialog, setCredentialsDialog] = useState<Platform | null>(null)
  const [testingPlatform, setTestingPlatform] = useState<Platform | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState<Platform | null>(null)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/accounts')

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data: AccountsResponse = await response.json()
      setAccounts(data.accounts)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      showNotification('error', 'Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platform: Platform) => {
    try {
      setConnectingPlatform(platform)

      // Redirect to OAuth flow
      window.location.href = `/api/auth/${platform}`
    } catch (error) {
      console.error('Error connecting platform:', error)
      showNotification('error', `Failed to connect ${platformConfigs[platform].name}`)
      setConnectingPlatform(null)
    }
  }

  const handleDisconnect = async (platform: Platform) => {
    try {
      const response = await fetch(`/api/auth/disconnect?platform=${platform}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      showNotification('success', `${platformConfigs[platform].name} disconnected successfully`)
      await fetchAccounts()
      setDisconnectDialog(null)
    } catch (error) {
      console.error('Error disconnecting platform:', error)
      showNotification('error', `Failed to disconnect ${platformConfigs[platform].name}`)
    }
  }

  const handleTestConnection = async (platform: Platform) => {
    try {
      setTestingPlatform(platform)

      const response = await fetch('/api/auth/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Connection test failed')
      }

      showNotification('success', data.message || `${platformConfigs[platform].name} connection is working`)
    } catch (error: any) {
      console.error('Error testing connection:', error)
      showNotification('error', error.message || `Connection test failed for ${platformConfigs[platform].name}`)
    } finally {
      setTestingPlatform(null)
    }
  }

  const handleSaveCredentials = async (platform: Platform) => {
    try {
      // Validate required fields
      const requiredFields = platformConfigs[platform].credentialFields.filter(
        f => !f.label.includes('Optional')
      )
      const missingFields = requiredFields.filter(f => !credentials[f.name]?.trim())

      if (missingFields.length > 0) {
        showNotification('error', `Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`)
        return
      }

      const response = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          credentials,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save credentials')
      }

      showNotification('success', 'API credentials saved successfully')
      setCredentialsDialog(null)
      setCredentials({})

      // Refresh accounts to show updated connection status
      await fetchAccounts()
    } catch (error: any) {
      console.error('Error saving credentials:', error)
      showNotification('error', error.message || 'Failed to save API credentials')
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const getAccountStatus = (account: PlatformAccount) => {
    if (!account.isConnected) {
      return { text: 'Not Connected', variant: 'default' as const }
    }
    if (account.isExpired) {
      return { text: 'Expired - Reconnect', variant: 'error' as const }
    }
    if (account.daysUntilExpiration !== undefined && account.daysUntilExpiration < 7) {
      return { text: `Expires in ${account.daysUntilExpiration}d`, variant: 'warning' as const }
    }
    return { text: 'Connected', variant: 'success' as const }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Social Media Credentials</h1>
        <p className="text-white/60">
          Add your API credentials to enable automated posting across platforms. Click &quot;Add API Credentials&quot; for each platform you want to use.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <Alert variant={notification.type === 'success' ? 'success' : 'error'} className="dark:bg-white/10 dark:border-white/20">
          <AlertDescription className="dark:text-white">
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account) => {
          const config = platformConfigs[account.platform]
          const status = getAccountStatus(account)
          const isConnecting = connectingPlatform === account.platform
          const isTesting = testingPlatform === account.platform

          return (
            <Card key={account.platform} className="dark:bg-white/5 dark:border-white/10 hover:dark:bg-white/10 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                      {config.icon}
                    </div>
                    <div>
                      <CardTitle className="dark:text-white">{config.name}</CardTitle>
                      <div className="mt-1">
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </div>
                    </div>
                  </div>

                  {account.isConnected && !account.isExpired && (
                    <button
                      onClick={() => setShowAdvanced(showAdvanced === account.platform ? null : account.platform)}
                      className="text-white/40 hover:text-white/80 transition-colors"
                      title="Settings"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
                <CardDescription className="dark:text-white/50 mt-2">
                  {config.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Connected Account Info */}
                {account.isConnected && account.providerUserId && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-white/40">Account ID</p>
                    <p className="text-sm text-white font-mono truncate">{account.providerUserId}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!account.isConnected || account.isExpired ? (
                    <>
                      <Button
                        onClick={() => setCredentialsDialog(account.platform)}
                        className={`flex-1 bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white border-0`}
                      >
                        <span className="mr-2">🔑</span>
                        Add API Credentials
                      </Button>
                      <Button
                        onClick={() => handleConnect(account.platform)}
                        disabled={isConnecting}
                        variant="outline"
                        className="dark:border-white/20 dark:hover:bg-white/5 dark:text-white"
                        title="Connect via OAuth (requires app credentials)"
                      >
                        {isConnecting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            OAuth...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🔗</span>
                            OAuth
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleTestConnection(account.platform)}
                        disabled={isTesting}
                        variant="outline"
                        className="flex-1 dark:border-white/20 dark:hover:bg-white/5 dark:text-white"
                      >
                        {isTesting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Testing...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">✓</span>
                            Test Connection
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setDisconnectDialog(account.platform)}
                        variant="outline"
                        className="dark:border-red-500/20 dark:hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>

                {/* Advanced Settings */}
                {showAdvanced === account.platform && (
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">Advanced Settings</h4>
                        <p className="text-xs text-white/40 mt-1">Use your own API credentials</p>
                      </div>
                      <Button
                        onClick={() => setCredentialsDialog(account.platform)}
                        size="sm"
                        variant="outline"
                        className="dark:border-white/20 dark:hover:bg-white/5 dark:text-white"
                      >
                        Manage API Keys
                      </Button>
                    </div>

                    <div className="text-xs text-white/40">
                      <p className="mb-1">Required scopes:</p>
                      <div className="flex flex-wrap gap-1">
                        {config.scopes.map(scope => (
                          <span key={scope} className="px-2 py-0.5 bg-white/5 rounded border border-white/10 font-mono">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                      <a
                        href={config.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        API Documentation
                      </a>
                      <span className="text-white/20">•</span>
                      <a
                        href={config.developerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Developer Portal
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Help Section */}
      <Card className="dark:bg-white/5 dark:border-white/10">
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <span>ℹ️</span>
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-white/60">
          <div>
            <h4 className="font-medium text-white mb-2">How to connect your accounts:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Click the "Connect" button for the platform you want to link</li>
              <li>You'll be redirected to the platform's authorization page</li>
              <li>Log in and approve the permissions requested</li>
              <li>You'll be redirected back here once connected</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-white mb-2">Using your own API credentials:</h4>
            <p>
              For advanced users, you can use your own API keys instead of our OAuth integration.
              This gives you more control and higher rate limits. Click "Manage API Keys" in the
              advanced settings to configure custom credentials.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-2">Token expiration:</h4>
            <p>
              Social media tokens expire periodically for security. You'll see a warning when your
              token is about to expire, and you can reconnect at any time to refresh it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Dialog */}
      {disconnectDialog && (
        <Dialog open={true} onOpenChange={() => setDisconnectDialog(null)}>
          <DialogContent className="dark:bg-gray-900 dark:text-white">
            <DialogHeader>
              <DialogTitle>Disconnect {platformConfigs[disconnectDialog].name}?</DialogTitle>
              <DialogDescription className="dark:text-white/60">
                This will remove your {platformConfigs[disconnectDialog].name} connection and you won't be able to post
                to this platform until you reconnect. Any scheduled posts for this platform will fail.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDisconnectDialog(null)}
                className="dark:border-white/20 dark:hover:bg-white/5 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDisconnect(disconnectDialog)}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Credentials Dialog */}
      {credentialsDialog && (
        <Dialog open={true} onOpenChange={() => {
          setCredentialsDialog(null)
          setCredentials({})
          setShowPassword({})
        }}>
          <DialogContent className="dark:bg-gray-900 dark:text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {platformConfigs[credentialsDialog].name} API Credentials
              </DialogTitle>
              <DialogDescription className="dark:text-white/60">
                Enter your own API credentials for {platformConfigs[credentialsDialog].name}.
                These will be stored securely and used instead of our OAuth integration.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {platformConfigs[credentialsDialog].credentialFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Input
                      type={field.type === 'password' && !showPassword[field.name] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={credentials[field.name] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [field.name]: e.target.value })}
                      className="dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-white/30 pr-10"
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, [field.name]: !showPassword[field.name] })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                      >
                        {showPassword[field.name] ? '🙈' : '👁️'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-white/40">{field.helpText}</p>
                </div>
              ))}

              <Alert variant="warning" className="dark:bg-yellow-500/10 dark:border-yellow-500/20">
                <AlertTitle className="dark:text-yellow-400">Important</AlertTitle>
                <AlertDescription className="dark:text-yellow-200/80 text-xs">
                  Make sure you have the correct permissions set in your{' '}
                  <a
                    href={platformConfigs[credentialsDialog].developerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-100"
                  >
                    developer portal
                  </a>
                  . Incorrect credentials will cause posting to fail.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCredentialsDialog(null)
                  setCredentials({})
                  setShowPassword({})
                }}
                className="dark:border-white/20 dark:hover:bg-white/5 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveCredentials(credentialsDialog)}
                className={`bg-gradient-to-r ${platformConfigs[credentialsDialog].gradient} hover:opacity-90 text-white border-0`}
              >
                Save Credentials
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
