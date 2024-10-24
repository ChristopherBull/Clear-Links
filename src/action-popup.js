import * as ActionBadge from './action-badge.js';
import * as Permissions from './permissions.js';

document.addEventListener('DOMContentLoaded', () => {
  initialise();
});

/**
 * Initialise the action popup.
 * This function sets up event listeners for various buttons in the action
 * popup, checks permissions status, makes some UI tweaks that need to be
 * at runtime, and updates the UI based on the extensions status.
 */
async function initialise() {
  // Set up event listeners for buttons
  document.getElementById('link-all-settings').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
  document.getElementById('grant-permission').addEventListener('click', async () => {
    const permissionsGranted = await Permissions.requestCriticalPermissions();
    if (permissionsGranted) {
      document.getElementById('permission-status').style.display = 'none';
      ActionBadge.clearStatus();
    }
  });
  const moreInfoToggle = document.getElementById('status-more-info-toggle');
  moreInfoToggle.addEventListener('click', (event) => {
    event.preventDefault();
    if (moreInfo.style.display === 'none') {
      // Set the max-width of the permission status area and the more info button to their current widths
      // to prevent showing text from resizing the status area.
      const permissionStatus = document.getElementById('permission-status');
      const permissionStatusStyle = getComputedStyle(permissionStatus);
      permissionStatus.style.maxWidth = permissionStatusStyle.width;
      const moreInfoToggleStyle = getComputedStyle(moreInfoToggle);
      moreInfoToggle.style.width = moreInfoToggleStyle.width;
      // Show more info
      moreInfo.style.display = 'block';
      moreInfoToggle.textContent = 'Hide more info';
    } else {
      // Hide more info
      moreInfo.style.display = 'none';
      moreInfoToggle.textContent = 'Show more info';
    }
  });

  // Check permissions and show status message if needed
  // Also, update the badge text/status, as the background script may not be active and permissions may change
  const permissionsCurrentlyGranted = await Permissions.areCriticalPermissionsGranted();
  if (permissionsCurrentlyGranted) {
    // Hide status message and badge text
    ActionBadge.clearStatus();
  } else {
    // Show status message and badge text
    document.getElementById('permission-status').style.display = 'block';
    ActionBadge.setErrorStatus();
  }

  // Grab the computed Display style and attach it to the element
  // Otherwise this causes a bug where the element is hidden after the first click, despite CSS set correctly
  const moreInfo = document.getElementById('status-more-info');
  const moreInfoStyle = getComputedStyle(moreInfo);
  moreInfo.style.display = moreInfoStyle.display;
}
