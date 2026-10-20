/**
 * Razorpay Payment Integration Service
 *
 * Opens Razorpay checkout modal for paid courses.
 * Falls back to an interactive mock Razorpay overlay when real key is not configured.
 */

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

export const isRazorpayConfigured = Boolean(RAZORPAY_KEY_ID);

/**
 * Dynamically load the Razorpay checkout script.
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay checkout modal for a paid course.
 * If not configured, opens a high-fidelity interactive simulation modal.
 */
export const openCheckout = async ({
  courseName,
  amount,
  currency = 'INR',
  userEmail,
  userName,
  platformName = 'ACFIT Academy LMS',
}) => {
  // ── Live mode ──
  if (isRazorpayConfigured) {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      return { success: false, error: 'Failed to load Razorpay SDK. Check your internet connection.' };
    }

    const amountInSmallestUnit = Math.round(amount * 100);

    return new Promise((resolve) => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amountInSmallestUnit,
        currency,
        name: platformName,
        description: `Enrollment: ${courseName}`,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#3b82f6',
        },
        handler: (response) => {
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || null,
            method: 'Razorpay',
          });
        },
        modal: {
          ondismiss: () => {
            resolve({ success: false, error: 'Payment cancelled by user.' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        resolve({
          success: false,
          error: response.error?.description || 'Payment failed.',
        });
      });
      rzp.open();
    });
  }

  // ── High-Fidelity Interactive Mock mode ──
  console.log('Razorpay keys not set. Launching interactive simulator.');
  
  return new Promise((resolve) => {
    // 1. Create container
    const backdrop = document.createElement('div');
    backdrop.id = 'rzp-simulator-backdrop';
    
    // 2. Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
      #rzp-simulator-backdrop {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 17, 26, 0.7);
        backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      .rzp-sim-card {
        width: 380px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        color: #1e293b;
        display: flex;
        flex-direction: column;
        animation: rzp-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes rzp-slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .rzp-sim-header {
        background: #151e2e;
        color: #ffffff;
        padding: 24px;
        position: relative;
        border-bottom: 4px solid #3b82f6;
      }
      .rzp-sim-header-title {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -0.01em;
      }
      .rzp-sim-header-desc {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 4px;
        font-weight: 500;
      }
      .rzp-sim-header-price {
        font-size: 24px;
        font-weight: 900;
        margin-top: 12px;
        color: #3b82f6;
      }
      .rzp-sim-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        color: #64748b;
        font-size: 20px;
        cursor: pointer;
        transition: color 0.2s;
        padding: 4px;
        line-height: 1;
      }
      .rzp-sim-close:hover {
        color: #ffffff;
      }
      .rzp-sim-body {
        padding: 20px;
        flex: 1;
      }
      .rzp-sim-tabs {
        display: flex;
        border-bottom: 2px solid #f1f5f9;
        margin-bottom: 20px;
      }
      .rzp-sim-tab {
        flex: 1;
        padding: 10px 0;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        background: none;
        border: none;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s;
      }
      .rzp-sim-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
      }
      .rzp-sim-panel {
        display: none;
      }
      .rzp-sim-panel.active {
        display: block;
      }
      .rzp-sim-input-group {
        margin-bottom: 14px;
      }
      .rzp-sim-input-group label {
        display: block;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 6px;
        letter-spacing: 0.05em;
      }
      .rzp-sim-input {
        width: 100%;
        padding: 10px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        background: #ffffff;
        box-sizing: border-box;
      }
      .rzp-sim-input:focus {
        border-color: #3b82f6;
        outline: none;
      }
      .rzp-sim-row {
        display: flex;
        gap: 12px;
      }
      .rzp-sim-btn {
        width: 100%;
        background: #3b82f6;
        color: #ffffff;
        border: none;
        padding: 12px;
        font-size: 13px;
        font-weight: 800;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        margin-top: 10px;
      }
      .rzp-sim-btn:hover {
        background: #2563eb;
      }
      .rzp-sim-footer {
        padding: 16px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        font-size: 10px;
        color: #64748b;
        font-weight: 700;
        letter-spacing: 0.02em;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
      }
      .rzp-sim-footer svg {
        color: #3b82f6;
      }
      /* Loading Screen */
      .rzp-sim-processing {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }
      .rzp-sim-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #f1f5f9;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: rzp-spin 1s linear infinite;
        margin-bottom: 24px;
      }
      @keyframes rzp-spin {
        to { transform: rotate(360deg); }
      }
      .rzp-sim-proc-title {
        font-size: 15px;
        font-weight: 800;
        color: #0f172a;
      }
      .rzp-sim-proc-desc {
        font-size: 12px;
        color: #64748b;
        margin-top: 8px;
        font-weight: 500;
      }
      .rzp-sim-actions {
        display: flex;
        gap: 10px;
        margin-top: 24px;
        width: 100%;
      }
      .rzp-sim-action-btn {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        border: none;
      }
      .rzp-sim-action-success {
        background: #10b981;
        color: #ffffff;
      }
      .rzp-sim-action-failure {
        background: #ef4444;
        color: #ffffff;
      }
      /* Bank selector list */
      .rzp-sim-bank-grid {
        display: grid;
        grid-template-cols: 1fr 1fr;
        gap: 8px;
      }
      .rzp-sim-bank-btn {
        padding: 10px;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        color: #334155;
        text-align: left;
        cursor: pointer;
      }
      .rzp-sim-bank-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }
      .rzp-sim-bank-btn.selected {
        background: #eff6ff;
        border-color: #3b82f6;
        color: #1d4ed8;
      }
      /* UPI apps lists */
      .rzp-sim-upi-apps {
        display: flex;
        justify-content: space-around;
        margin-top: 14px;
      }
      .rzp-sim-upi-app {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
      }
      .rzp-sim-upi-logo {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
        font-size: 16px;
      }
    `;

    // 3. Inject HTML Structure
    const currencySym = '₹';
    backdrop.innerHTML = `
      <div class="rzp-sim-card">
        <!-- Header -->
        <div class="rzp-sim-header">
          <button class="rzp-sim-close" id="rzp-sim-close-btn">&times;</button>
          <div class="rzp-sim-header-title">${platformName}</div>
          <div class="rzp-sim-header-desc">Registration: ${courseName}</div>
          <div class="rzp-sim-header-price">${currencySym}${amount}</div>
        </div>

        <!-- Form Panels Container -->
        <div class="rzp-sim-body" id="rzp-sim-form-container">
          <div class="rzp-sim-tabs">
            <button class="rzp-sim-tab active" data-tab="card">CARD</button>
            <button class="rzp-sim-tab" data-tab="upi">UPI</button>
            <button class="rzp-sim-tab" data-tab="netbank">NETBANKING</button>
          </div>

          <!-- Card Panel -->
          <div class="rzp-sim-panel active" id="rzp-panel-card">
            <div class="rzp-sim-input-group">
              <label>Card Number</label>
              <input type="text" class="rzp-sim-input" placeholder="4111 2222 3333 4444" value="4111 2222 3333 4444">
            </div>
            <div class="rzp-sim-row">
              <div class="rzp-sim-input-group" style="flex: 1;">
                <label>Expiry</label>
                <input type="text" class="rzp-sim-input" placeholder="MM/YY" value="12/28">
              </div>
              <div class="rzp-sim-input-group" style="flex: 1;">
                <label>Cardholder Name</label>
                <input type="text" class="rzp-sim-input" placeholder="Name" value="${userName}">
              </div>
              <div class="rzp-sim-input-group" style="width: 70px;">
                <label>CVV</label>
                <input type="password" class="rzp-sim-input" placeholder="•••" value="123">
              </div>
            </div>
            <button class="rzp-sim-btn rzp-pay-trigger">Pay ${currencySym}${amount}</button>
          </div>

          <!-- UPI Panel -->
          <div class="rzp-sim-panel" id="rzp-panel-upi">
            <div class="rzp-sim-input-group">
              <label>Enter Virtual Payment Address (VPA)</label>
              <input type="text" class="rzp-sim-input" id="rzp-upi-vpa" placeholder="username@upi" value="${userEmail.split('@')[0]}@okaxis">
            </div>
            <div class="rzp-sim-upi-apps">
              <button class="rzp-sim-upi-app" data-vpa="${userEmail.split('@')[0]}@okgoogle">
                <div class="rzp-sim-upi-logo" style="background: #e8f0fe; color: #1a73e8;">G</div>
                GPay
              </button>
              <button class="rzp-sim-upi-app" data-vpa="${userEmail.split('@')[0]}@ybl">
                <div class="rzp-sim-upi-logo" style="background: #f3e5f5; color: #7b1fa2;">P</div>
                PhonePe
              </button>
              <button class="rzp-sim-upi-app" data-vpa="${userEmail.split('@')[0]}@paytm">
                <div class="rzp-sim-upi-logo" style="background: #e1f5fe; color: #0288d1;">Py</div>
                Paytm
              </button>
            </div>
            <button class="rzp-sim-btn rzp-pay-trigger" style="margin-top: 24px;">Pay ${currencySym}${amount}</button>
          </div>

          <!-- Netbanking Panel -->
          <div class="rzp-sim-panel" id="rzp-panel-netbank">
            <label style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 10px; letter-spacing: 0.05em;">Select Popular Bank</label>
            <div class="rzp-sim-bank-grid">
              <button class="rzp-sim-bank-btn selected">State Bank of India</button>
              <button class="rzp-sim-bank-btn">HDFC Bank</button>
              <button class="rzp-sim-bank-btn">ICICI Bank</button>
              <button class="rzp-sim-bank-btn">Axis Bank</button>
            </div>
            <button class="rzp-sim-btn rzp-pay-trigger" style="margin-top: 30px;">Pay ${currencySym}${amount}</button>
          </div>
        </div>

        <!-- Processing Screen -->
        <div class="rzp-sim-body rzp-sim-processing" id="rzp-sim-processing-container">
          <div class="rzp-sim-spinner"></div>
          <div class="rzp-sim-proc-title">Simulating Payment</div>
          <div class="rzp-sim-proc-desc">Waiting for bank authentication. Please select payment response to continue testing.</div>
          <div class="rzp-sim-actions">
            <button class="rzp-sim-action-btn rzp-sim-action-success" id="rzp-sim-btn-success">Simulate Success</button>
            <button class="rzp-sim-action-btn rzp-sim-action-failure" id="rzp-sim-btn-fail">Simulate Failure</button>
          </div>
        </div>

        <!-- Footer -->
        <div class="rzp-sim-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          Secured by Razorpay • Mock Sandbox
        </div>
      </div>
    `;

    backdrop.appendChild(style);
    document.body.appendChild(backdrop);

    // 4. Implement Interactions & Handlers
    const closeBtn = document.getElementById('rzp-sim-close-btn');
    const tabs = document.querySelectorAll('.rzp-sim-tab');
    const panels = document.querySelectorAll('.rzp-sim-panel');
    const payButtons = document.querySelectorAll('.rzp-pay-trigger');
    const formContainer = document.getElementById('rzp-sim-form-container');
    const processingContainer = document.getElementById('rzp-sim-processing-container');
    const successBtn = document.getElementById('rzp-sim-btn-success');
    const failBtn = document.getElementById('rzp-sim-btn-fail');
    const upiApps = document.querySelectorAll('.rzp-sim-upi-app');
    const upiInput = document.getElementById('rzp-upi-vpa');
    const bankButtons = document.querySelectorAll('.rzp-sim-bank-btn');

    let activeMethod = 'Card';

    // Tab Switch handler
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const selectedTab = tab.getAttribute('data-tab');
        document.getElementById(`rzp-panel-${selectedTab}`).classList.add('active');

        if (selectedTab === 'card') activeMethod = 'Card';
        else if (selectedTab === 'upi') activeMethod = 'UPI';
        else if (selectedTab === 'netbank') activeMethod = 'Netbanking';
      });
    });

    // Bank Selection handler
    bankButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        bankButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // UPI Quick Apps handler
    upiApps.forEach(app => {
      app.addEventListener('click', () => {
        const vpa = app.getAttribute('data-vpa');
        if (upiInput) upiInput.value = vpa;
      });
    });

    // Close checkout handler (Failure / Cancelled)
    const cleanup = () => {
      backdrop.remove();
    };

    closeBtn.addEventListener('click', () => {
      cleanup();
      resolve({ success: false, error: 'Payment cancelled by user.' });
    });

    // Pay now trigger - shows simulated loading screen
    payButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        processingContainer.style.display = 'flex';
      });
    });

    // Simulate Success response
    successBtn.addEventListener('click', () => {
      cleanup();
      resolve({
        success: true,
        paymentId: `pay_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        orderId: `order_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        method: activeMethod,
      });
    });

    // Simulate Failure response
    failBtn.addEventListener('click', () => {
      cleanup();
      resolve({
        success: false,
        error: 'Simulated payment failure. Please try another card/method.'
      });
    });
  });
};
