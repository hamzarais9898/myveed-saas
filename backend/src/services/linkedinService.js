/**
 * LinkedIn Publishing Service
 * Handles OAuth and video publishing to LinkedIn (Simulated)
 */

exports.getAuthUrl = () => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI || `${process.env.FRONTEND_URL}/platforms`);
  const scope = encodeURIComponent('w_member_social r_liteprofile');

  // Simulation mode if no real client ID
  if (!clientId || clientId === 'mock_linkedin_id') {
    return `${process.env.FRONTEND_URL}/platforms?linkedin=connected&token=li_simulated_${Date.now()}`;
  }

  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
};

exports.exchangeCodeForToken = async (code) => {
  try {
    console.log('Exchanging LinkedIn code for token:', code);
    const mockToken = `li_mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return mockToken;
  } catch (error) {
    console.error('LinkedIn token exchange error:', error);
    throw new Error('Failed to exchange LinkedIn code for token');
  }
};

exports.publishVideo = async (accessToken, videoUrl, text = '') => {
  try {
    console.log('Publishing video to LinkedIn:', videoUrl);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockPostId = `li_post_${Date.now()}`;
    return {
      success: true,
      postId: mockPostId,
      platform: 'linkedin'
    };
  } catch (error) {
    console.error('LinkedIn publish error:', error);
    throw new Error('Failed to publish video to LinkedIn');
  }
};
