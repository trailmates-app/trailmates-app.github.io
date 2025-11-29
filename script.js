// MODAL FUNCTIONS
function showComingSoonModal(buttonSource) {
  const modal = document.getElementById('comingSoonModal');
  
  // Track button click in PostHog
  if (window.posthog) {
    posthog.capture('button_clicked', {
      button_name: buttonSource,
      button_location: buttonSource === 'get_started' ? 'hero_section' : 'cta_section',
      action: 'show_coming_soon_modal',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Tracked: ${buttonSource} button clicked`);
  }
  
  // Show modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
}

function closeModal() {
  const modal = document.getElementById('comingSoonModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Re-enable scrolling
  
  // Track modal close
  if (window.posthog) {
    posthog.capture('modal_closed', {
      modal_type: 'coming_soon',
      timestamp: new Date().toISOString()
    });
  }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  const modal = document.getElementById('comingSoonModal');
  if (event.target == modal) {
    closeModal();
  }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// POSTHOG SURVEYS EVENT LISTENERS
if (window.posthog) {
  // Track when surveys are shown
  posthog.onFeatureFlags(function() {
    console.log('🎯 PostHog Surveys ready');
    
    const surveys = posthog.getActiveMatchingSurveys();
    if (surveys && surveys.length > 0) {
      console.log('📊 Active surveys found:', surveys.length);
    }
  });
}

// Listen for PostHog survey responses
window.addEventListener('posthog-survey-shown', function(e) {
  console.log('📊 Survey shown to user:', e.detail);
  
  if (window.posthog) {
    posthog.capture('survey_displayed', {
      survey_id: e.detail?.survey_id,
      survey_name: e.detail?.survey_name,
      timestamp: new Date().toISOString()
    });
  }
});

window.addEventListener('posthog-survey-dismissed', function(e) {
  console.log('❌ Survey dismissed by user:', e.detail);
  
  if (window.posthog) {
    posthog.capture('survey_dismissed', {
      survey_id: e.detail?.survey_id,
      survey_name: e.detail?.survey_name,
      timestamp: new Date().toISOString()
    });
  }
});

window.addEventListener('posthog-survey-sent', function(e) {
  console.log('✅ Survey response sent:', e.detail);
  
  if (window.posthog) {
    const surveyResponse = e.detail?.survey_response;
    
    // If the survey collected an email, identify the user
    if (surveyResponse && isValidEmail(surveyResponse)) {
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
      
      console.log('✅ User identified with email:', surveyResponse);
    }
    
    posthog.capture('survey_completed', {
      survey_id: e.detail?.survey_id,
      survey_name: e.detail?.survey_name,
      response: surveyResponse,
      method: 'posthog_popup',
      timestamp: new Date().toISOString()
    });
  }
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ANALYTICS TRACKING

// Track page view
if (window.posthog) {
  posthog.capture('landing_page_viewed', {
    page_name: 'TrailMates Landing Page',
    timestamp: new Date().toISOString()
  });
}

// Track scroll depth
let maxScroll = 0;
let scrollMilestones = [25, 50, 75, 100];

window.addEventListener('scroll', function() {
  const scrollPercent = Math.round(
    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );
  
  if (scrollPercent > maxScroll) {
    maxScroll = scrollPercent;
    
    // Track each milestone once
    scrollMilestones.forEach(function(milestone) {
      if (scrollPercent >= milestone && !window[`tracked_${milestone}`]) {
        window[`tracked_${milestone}`] = true;
        
        if (window.posthog) {
          posthog.capture('page_scrolled', {
            scroll_depth: milestone + '%',
            page: 'landing_page',
            timestamp: new Date().toISOString()
          });
          
          console.log(`📊 Tracked scroll: ${milestone}%`);
        }
      }
    });
  }
});

// Track time on page
let startTime = Date.now();
let timeTracked = false;

window.addEventListener('beforeunload', function() {
  if (!timeTracked) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    if (window.posthog) {
      posthog.capture('time_on_page', {
        duration_seconds: timeSpent,
        duration_minutes: Math.round(timeSpent / 60),
        page: 'landing_page',
        timestamp: new Date().toISOString()
      });
    }
    
    timeTracked = true;
  }
});

// Track engagement level based on actions
let engagementScore = 0;
let engagementTracked = false;

function trackEngagement(points, action) {
  engagementScore += points;
  
  if (window.posthog && !engagementTracked) {
    // Track high engagement users (score > 50)
    if (engagementScore >= 50) {
      posthog.capture('high_engagement_user', {
        engagement_score: engagementScore,
        actions_taken: action,
        timestamp: new Date().toISOString()
      });
      
      engagementTracked = true;
      console.log('🔥 High engagement user tracked!');
    }
  }
}

// Add engagement tracking to key actions
document.addEventListener('DOMContentLoaded', function() {
  // Track clicks on features
  const features = document.querySelectorAll('.feature');
  features.forEach(function(feature) {
    feature.addEventListener('click', function() {
      trackEngagement(10, 'feature_clicked');
      
      if (window.posthog) {
        posthog.capture('feature_explored', {
          feature_name: this.querySelector('h3').textContent,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

// Debug helper
console.log('📊 TrailMates Analytics loaded');
console.log('✅ PostHog available:', typeof window.posthog !== 'undefined');
console.log('✅ Modal functions ready');
console.log('📈 Button click tracking: ENABLED');
console.log('📧 Survey tracking: ENABLED');
