/**
 * Filename: jlc_on_receivevoucher_req.js
 * Description: Loon script triggered when JLC app receives a voucher.
 * Currently logs the event.
 */
console.log("Loon Script: JLC - 捕获到领取优惠券请求 (receiveVoucher)");
console.log("请求URL: " + $request.url);

// Add custom logic if needed.
$done({});