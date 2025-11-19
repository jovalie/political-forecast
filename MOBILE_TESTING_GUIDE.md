# Mobile Phone Compatibility Testing Guide

This guide explains how to test the Political Forecast app on mobile devices.

## Method 1: Browser DevTools Device Emulation (Easiest)

### Chrome/Edge DevTools

1. **Open your app** in Chrome or Edge
   - Local: `http://localhost:5173`
   - Production: `https://matt7ai.github.io/political-forecast/`

2. **Open DevTools**
   - **Mac**: `Cmd + Option + I` or `F12`
   - **Windows/Linux**: `Ctrl + Shift + I` or `F12`

3. **Toggle Device Toolbar**
   - **Mac**: `Cmd + Shift + M`
   - **Windows/Linux**: `Ctrl + Shift + M`
   - Or click the device icon in the toolbar

4. **Select a device** from the dropdown:
   - iPhone SE (375px)
   - iPhone 12/13/14 (390px)
   - iPhone 14 Pro Max (430px)
   - Samsung Galaxy S20 (360px)
   - iPad Mini (768px)
   - Or enter custom dimensions

5. **Test the following**:
   - ✅ Page loads correctly
   - ✅ Map is visible and interactive (tap to zoom, pan)
   - ✅ Header is readable (title visible, subtitle hidden on mobile)
   - ✅ Theme toggle is accessible and works
   - ✅ Tap a state on the map
   - ✅ Sidebar slides up from bottom
   - ✅ Sidebar content is scrollable
   - ✅ Tap overlay or press Escape to close sidebar
   - ✅ Theme switching works
   - ✅ All text is readable

### Firefox DevTools

1. Open app in Firefox
2. Open DevTools (`F12`)
3. Click the "Responsive Design Mode" icon (or press `Cmd + Shift + M` / `Ctrl + Shift + M`)
4. Select device from dropdown or set custom size
5. Test same features as above

### Safari DevTools (Mac only)

1. Enable Developer menu: Safari → Preferences → Advanced → "Show Develop menu"
2. Open app in Safari
3. Develop → Enter Responsive Design Mode
4. Select device from dropdown
5. Test same features

## Method 2: Test on Real Mobile Device (Most Accurate)

### Option A: Using Local Network (Development)

1. **Find your computer's IP address**:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   Look for something like `192.168.1.xxx` or `10.0.0.xxx`

2. **Start dev server** (if not already running):
   ```bash
   npm run dev
   ```
   Note the port (usually 5173)

3. **On your phone**:
   - Make sure phone is on the same Wi-Fi network as your computer
   - Open browser (Safari on iPhone, Chrome on Android)
   - Go to: `http://YOUR_IP_ADDRESS:5173`
   - Example: `http://192.168.1.100:5173`

4. **Test the app** on your actual phone

### Option B: Using Production URL (Easiest)

1. **Deploy to GitHub Pages** (if not already deployed)
2. **On your phone**, open browser
3. **Go to**: `https://matt7ai.github.io/political-forecast/`
4. **Test the app** on your actual phone

### Option C: Using ngrok (For Testing Without Deployment)

1. **Install ngrok**:
   ```bash
   # Mac
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your dev server**:
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok**:
   ```bash
   ngrok http 5173
   ```

4. **Copy the HTTPS URL** from ngrok (e.g., `https://abc123.ngrok.io`)

5. **On your phone**, open that URL in browser

6. **Test the app**

## Method 3: Online Testing Tools

### BrowserStack (Free Trial)
1. Go to https://www.browserstack.com
2. Sign up for free trial
3. Select "Live" testing
4. Choose device (iPhone, Android, etc.)
5. Enter your app URL
6. Test in real browser on real device

### LambdaTest (Free Trial)
1. Go to https://www.lambdatest.com
2. Sign up for free trial
3. Select "Real Time Testing"
4. Choose device and browser
5. Enter your app URL
6. Test remotely

## What to Test on Mobile

### Visual Checks
- [ ] **Header**: Title visible, subtitle hidden, theme toggle accessible
- [ ] **Map**: Full width, states are visible, colors display correctly
- [ ] **Text**: All text is readable (not too small)
- [ ] **Spacing**: Elements aren't cramped
- [ ] **Theme**: Light and dark modes work correctly

### Interaction Checks
- [ ] **Map Tapping**: Can tap states to select them
- [ ] **Map Panning**: Can drag to pan the map
- [ ] **Map Zooming**: Can pinch to zoom (on real device) or use +/- buttons
- [ ] **Sidebar Opening**: Tapping a state opens sidebar from bottom
- [ ] **Sidebar Scrolling**: Can scroll through topic list
- [ ] **Sidebar Closing**: Can close by tapping overlay, pressing Escape, or close button
- [ ] **Theme Toggle**: Can tap theme toggle to switch themes
- [ ] **Topic Links**: Can tap topic links to open Google News

### Performance Checks
- [ ] **Load Time**: App loads within 3 seconds
- [ ] **Map Render**: Map appears within 2 seconds
- [ ] **Smooth Scrolling**: Sidebar scrolls smoothly
- [ ] **No Lag**: Interactions feel responsive

### Edge Cases
- [ ] **Portrait Mode**: App works in portrait orientation
- [ ] **Landscape Mode**: App works in landscape orientation (if supported)
- [ ] **Small Screens**: Test on smallest device (iPhone SE, 375px)
- [ ] **Large Screens**: Test on largest device (iPhone Pro Max, 430px)
- [ ] **Slow Network**: Test on slow 3G (use DevTools throttling)

## Common Mobile Issues to Watch For

### Touch Targets Too Small
- Buttons/links should be at least 44×44px for easy tapping
- Check: Theme toggle, close button, topic links

### Text Too Small
- Minimum font size should be 16px to prevent auto-zoom on iOS
- Check: All text in sidebar, topic names

### Horizontal Scrolling
- Page should not scroll horizontally
- Check: All content fits within viewport width

### Viewport Issues
- Make sure viewport meta tag is present: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Check: `index.html` has this tag

### Map Interaction Issues
- Map should respond to touch gestures
- Check: Can tap states, can pan, can zoom

### Sidebar Issues
- Sidebar should slide smoothly
- Check: Animation is smooth, no janky movement
- Check: Sidebar doesn't cover important content when closed

## Quick Test Checklist

**Before testing, make sure:**
- [ ] Dev server is running (for local testing)
- [ ] App is deployed (for production testing)
- [ ] Browser DevTools is open (for emulation)

**During testing:**
- [ ] Test on at least 2-3 different device sizes
- [ ] Test both light and dark themes
- [ ] Test all major interactions (map, sidebar, theme toggle)
- [ ] Test on real device if possible

**After testing:**
- [ ] Document any issues found
- [ ] Note which devices/browsers were tested
- [ ] Update test results in `RESPONSIVE_TESTING.md`

## Recommended Testing Devices

### Must Test (Priority)
1. **iPhone SE (375px)** - Smallest common mobile size
2. **iPhone 12/13/14 (390px)** - Most common iPhone size
3. **Samsung Galaxy S20 (360px)** - Common Android size

### Should Test (If Time Permits)
4. **iPhone 14 Pro Max (430px)** - Largest iPhone
5. **iPad Mini (768px)** - Tablet size
6. **iPad Pro (1024px)** - Large tablet

## Troubleshooting

### Can't Access Local Server on Phone
- Make sure phone and computer are on same Wi-Fi
- Check firewall isn't blocking port 5173
- Try using production URL instead

### Map Not Loading on Mobile
- Check console for errors
- Verify data files are accessible
- Check network tab for failed requests

### Sidebar Not Appearing
- Check if state was actually clicked
- Look for JavaScript errors in console
- Verify CSS is loading correctly

### Theme Toggle Not Working
- Check if JavaScript is enabled
- Look for errors in console
- Verify localStorage is available

## Next Steps

After testing:
1. Document results in `RESPONSIVE_TESTING.md`
2. Fix any issues found
3. Re-test to verify fixes
4. Update `MVP_STEPS.md` when complete

