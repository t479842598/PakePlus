/**
 * Filename: jlc_on_userinfo_req.js
 * Description: Loon script triggered when JLC app requests user info.
 * Currently logs the event. Can be expanded for more actions.
 */
console.log("Loon Script: JLC - 捕获到用户信息请求 (selectPersonalInfo)");
console.log("请求URL: " + $request.url);
// Add any custom logic here, e.g., modify request, log headers, etc.
// For example, to log the access token from the request headers if present:
// if ($request.headers && $request.headers['x-jlc-accesstoken']) {
//   console.log("x-jlc-accesstoken from request: " + $request.headers['x-jlc-accesstoken']);
// }

// If you need to modify the request before it's sent, you can do something like:
// $request.headers['New-Header'] = 'SomeValue';
// $done($request); // Pass the modified request object to $done

// If you just want to let the request pass through unmodified after logging:
$done({}); // Empty object means no modifications