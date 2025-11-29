// Function for "Get Started" button
function getStarted() {
  // Track event in PostHog
  if (window.posthog) {
    posthog.capture('get_started_clicked', {
      button_location: 'hero_section',
      page: 'landing_page'
    });
  }
  
  console.log('Get Started clicked!');
  // Add your redirect here if needed
  // window.location.href = 'signup.html';
}

// Function for "Join Now" button
function joinNow() {
  // Track event in PostHog
  if (window.posthog) {
    posthog.capture('join_now_clicked', {
      button_location: 'cta_section',
      page: 'landing_page'
    });
  }
  
  console.log('Join Now clicked!');
  // Add your redirect here if needed
  // window.location.href = 'signup.html';
}

// NEWSLETTER FORM HANDLER (for the always-visible form)
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('newsletterForm');
  const emailInput = document.getElementById('emailInput');
  const formMessage = document.getElementById('formMessage');

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      
      if (!email) {
        showMessage('Please enter your email address.', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
      }

      // Track newsletter signup in PostHog
      if (window.posthog) {
        // Identify the user with their email
        posthog.identify(email, {
          email: email,
          subscribed_at: new Date().toISOString(),
          subscription_source: 'newsletter_form'
        });

        // Capture the event
        posthog.capture('newsletter_subscribed', {
          email: email,
          source: 'landing_page_form',
          method: 'inline_form',
          timestamp: new Date().toISOString()
        });

        // Set user properties
        posthog.people.set({
          email: email,
          newsletter_subscriber: true,
          subscription_date: new Date().toISOString()
        });
      }

      // Show success message
      showMessage('🎉 Thank you for subscribing! Check your email for confirmation.', 'success');
      
      // Clear the form
      emailInput.value = '';
    });
  }

  function showMessage(message, type) {
    if (formMessage) {
      formMessage.textContent = message;
      formMessage.className = 'form-message ' + type;
      
      // Hide message after 5 seconds
      setTimeout(() => {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
      }, 5000);
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});

// POSTHOG SURVEYS EVENT LISTENERS
// Listen for survey events and track them
if (window.posthog) {
  // Track when surveys are shown
  posthog.onFeatureFlags(function() {
    console.log('🎯 PostHog Surveys ready');
    
    // Get active surveys
    const surveys = posthog.getActiveMatchingSurveys();
    if (surveys && surveys.length > 0) {
      console.log('📊 Active surveys found:', surveys.length);
    }
  });

  // You can also manually trigger a survey for testing
  // Uncomment this to test survey functionality:
  /*
  window.testSurvey = function() {
    posthog.capture('$survey_shown', {
      survey_id: 'test',
      survey_name: 'Test Survey'
    });
    console.log('Survey test triggered');
  };
  */
}

// Listen for PostHog survey responses (these fire automatically)
window.addEventListener('posthog-survey-shown', function(e) {
  console.log('📊 Survey shown to user:', e.detail);
  
  // Track that a survey was shown
  if (window.posthog) {
    posthog.capture('survey_displayed', {
      survey_id: e.detail?.survey_id,
      survey_name: e.detail?.survey_name
    });
  }
});

window.addEventListener('posthog-survey-dismissed', function(e) {
  console.log('❌ Survey dismissed by user:', e.detail);
  
  // Track survey dismissal
  if (window.posthog) {
    posthog.capture('survey_dismissed', {
      survey_id: e.detail?.survey_id,
      survey_name: e.detail?.survey_name
    });
  }
});

window.addEventListener('posthog-survey-sent', function(e) {
  console.log('✅ Survey response sent:', e.detail);
  
  // Track survey completion
  if (window.posthog) {
    const surveyResponse = e.detail?.survey_response;
    
    // If the survey collected an email, identify the user
    if (surveyResponse && isValidEmailString(surveyResponse)) {
      posthog.identify(surveyResponse, {
        email: surveyResponse,
        subscribed_at: new Date().toISOString(),
        subscription_source: 'posthog_survey'
      });
      
      posthog.people.set({
        email: surveyResponse,
        newsletter_subscriber: true,
        subscription_date: new Date().toISOString(),
        survey_completed: true
      });
    }
    
    posthog.capture('survey_completed', {
      survey_id: e.detail?.survey_id,
      survey_name: e.detail?.survey_name,
      response: surveyResponse,
      method: 'posthog_popup'
    });
  }
});

function isValidEmailString(str) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

// Track page view
if (window.posthog) {
  posthog.capture('landing_page_viewed', {
    page_name: 'TrailMates Landing Page',
    timestamp: new Date().toISOString()
  });
}

// Track scroll depth
let maxScroll = 0;
window.addEventListener('scroll', function() {
  const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  
  if (scrollPercent > maxScroll) {
    maxScroll = Math.floor(scrollPercent / 25) * 25;
    
    if (window.posthog && [25, 50, 75, 100].includes(maxScroll)) {
      posthog.capture('page_scrolled', {
        scroll_depth: maxScroll + '%',
        page: 'landing_page'
      });
    }
  }
});

// Track time on page
let startTime = Date.now();
window.addEventListener('beforeunload', function() {
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);
  
  if (window.posthog) {
    posthog.capture('time_on_page', {
      duration_seconds: timeSpent,
      page: 'landing_page'
    });
  }
});

// Debug helper - check if PostHog is working
console.log('📊 TrailMates Analytics loaded');
console.log('PostHog available:', typeof window.posthog !== 'undefined');
