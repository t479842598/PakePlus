/**
 * Filename: jlc_daily_all_tasks.js
 * Description: 嘉立创每日自动任务 (Loon 脚本)
 * Author: (Adaptation for Loon by AI, original logic by Telegram@sudojia)
 *
 * This script performs daily check-in, voucher claims, and point checks for JLC.
 * It requires 'jlcAuthToken' to be set in $persistentStore (format: 'x-jlc-accesstoken#secretkey').
 */

const $ = new CompatibilityLayer();

const JLC_AUTH_KEY = 'jlcAuthToken';
const BASE_URL = 'https://m.jlc.com';
let notificationMessages = ['嘉立创每日任务报告'];

async function main() {
    const authData = $persistentStore.read(JLC_AUTH_KEY);
    if (!authData || !authData.includes('#')) {
        const msg = "错误：嘉立创凭证未配置或格式不正确。请在 $persistentStore 中设置 jlcAuthToken (格式: 'accesstoken#secretkey')";
        console.log(msg);
        notificationMessages.push(msg);
        return;
    }

    const [accessToken, secretKey] = authData.split('#');
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36 Edg/90.0.818.51', // Example User-Agent
        'x-jlc-clienttype': 'WEB',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://m.jlc.com/mapp/pages/my/index',
        'x-jlc-accesstoken': accessToken,
        'secretkey': secretKey,
    };

    try {
        await getUserInfo(headers);
        await $.wait(getRandomWait(1000, 1500));
        await checkSignAndSign(headers); // Combines checkSign, sign, and receiveVoucher
        await $.wait(getRandomWait(1000, 1500));
        await getPoints(headers);
    } catch (error) {
        console.log(`脚本执行过程中发生错误: ${error}`);
        notificationMessages.push(`脚本执行错误: ${error.message || error}`);
    }
}

function getRandomWait(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getUserInfo(headers) {
    const url = `${BASE_URL}/api/appPlatform/center/setting/selectPersonalInfo`;
    try {
        const resp = await $.http.get({ url, headers });
        const data = JSON.parse(resp.body);
        if (data.success) {
            console.log(`获取用户信息成功: 昵称：${data.data.customerCode}`);
            notificationMessages.push(`👤 昵称：${data.data.customerCode}`);
        } else {
            console.log(`获取用户信息失败: ${data.message}`);
            notificationMessages.push(`❌ 获取用户信息失败: ${data.message}`);
        }
    } catch (e) {
        console.log(`获取用户信息异常: ${e}`);
        notificationMessages.push(`❌ 获取用户信息异常: ${e.message || e}`);
    }
}

async function checkSignAndSign(headers) {
    const checkUrl = `${BASE_URL}/api/activity/sign/getCurrentUserSignInConfig`;
    try {
        let resp = await $.http.get({ url: checkUrl, headers });
        let data = JSON.parse(resp.body);

        if (!data.success) {
            console.log(`检查签到状态失败: ${data.message}`);
            notificationMessages.push(`❌ 检查签到状态失败: ${data.message}`);
            return;
        }

        if (data.data.haveSignIn) {
            console.log('今日已签到');
            notificationMessages.push('✅ 今日已签到');
        } else {
            console.log('今日未签到，开始执行签到...');
            notificationMessages.push('⏳ 今日未签到，尝试签到...');
            await $.wait(getRandomWait(1000, 2000));

            const signInUrl = `${BASE_URL}/api/activity/sign/signIn?source=4`;
            resp = await $.http.get({ url: signInUrl, headers });
            data = JSON.parse(resp.body);

            if (data.success) {
                if (data.data.gainNum) {
                    console.log(`签到成功，金豆+${data.data.gainNum}`);
                    notificationMessages.push(`🎉 签到成功，金豆+${data.data.gainNum}`);
                } else {
                    // This case implies a reward might be available to be claimed manually after sign-in.
                    // The original script had a receiveVoucher call here.
                    console.log('签到操作完成，可能有奖励待领取。尝试领取奖励...');
                    notificationMessages.push('🤔 签到完成，尝试领取奖励...');
                    await $.wait(getRandomWait(1000, 1500));
                    await receiveVoucher(headers);
                }
            } else {
                console.log(`签到失败: ${data.message}`);
                notificationMessages.push(`❌ 签到失败: ${data.message}`);
            }
        }
    } catch (e) {
        console.log(`检查或执行签到异常: ${e}`);
        notificationMessages.push(`❌ 签到流程异常: ${e.message || e}`);
    }
}

async function receiveVoucher(headers) {
    const url = `${BASE_URL}/api/activity/sign/receiveVoucher`;
    try {
        const resp = await $.http.get({ url, headers });
        const data = JSON.parse(resp.body);
        if (data.success) {
            // The response for receiveVoucher might not directly state what was received.
            // It might be a voucher or points. The original script logs "领取成功".
            // We'll assume success implies some reward.
            console.log('领取奖励操作成功。');
            notificationMessages.push('🎁 领取奖励操作成功');
            // According to original script, after receiveVoucher, it calls sign() again.
            // This might be to update the state or get the gainNum if it wasn't available before.
            // For simplicity, we might omit this re-sign here or ensure the logic is robust.
            // Let's try calling sign again to get the points if it was a two-step process.
            await $.wait(getRandomWait(1000, 1500));
            const signInUrl = `${BASE_URL}/api/activity/sign/signIn?source=4`; // Re-check sign status/points
            const reSignResp = await $.http.get({ url: signInUrl, headers });
            const reSignData = JSON.parse(reSignResp.body);
            if (reSignData.success && reSignData.data.gainNum) {
                console.log(`再次签到确认，金豆+${reSignData.data.gainNum}`);
                notificationMessages.push(`🔄 领奖后再次确认，金豆+${reSignData.data.gainNum}`);
            } else if (reSignData.success) {
                console.log('再次签到确认完成，无额外金豆信息或已是最新状态。');
            }

        } else {
            console.log(`领取奖励失败: ${data.message}`);
            notificationMessages.push(`❌ 领取奖励失败: ${data.message}`);
        }
    } catch (e) {
        console.log(`领取奖励异常: ${e}`);
        notificationMessages.push(`❌ 领取奖励异常: ${e.message || e}`);
    }
}

async function getPoints(headers) {
    const url = `${BASE_URL}/api/activity/front/getCustomerIntegral`;
    try {
        const resp = await $.http.get({ url, headers });
        const data = JSON.parse(resp.body);
        if (data.success) {
            console.log(`获取金豆信息成功: 当前金豆：${data.data.integralVoucher}`);
            notificationMessages.push(`💰 当前金豆：${data.data.integralVoucher}`);
        } else {
            console.log(`获取金豆信息失败: ${data.message}`);
            notificationMessages.push(`❌ 获取金豆信息失败: ${data.message}`);
        }
    } catch (e) {
        console.log(`获取金豆信息异常: ${e}`);
        notificationMessages.push(`❌ 获取金豆信息异常: ${e.message || e}`);
    }
}

// --- Compatibility Layer (Copied from another script, ensure it's suitable or use Loon's native $httpClient) ---
// This is a simplified layer. For robust HTTP calls, directly use Loon's $httpClient if available,
// or ensure this layer fully matches needed functionality (e.g. promise-based $httpClient.get).
// Loon's $httpClient is already promise-based.
function CompatibilityLayer() {
    this.http = {
        get: (options) => {
            return new Promise((resolve, reject) => {
                $httpClient.get(options, (error, response, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ statusCode: response.status, headers: response.headers, body: body });
                    }
                });
            });
        },
        post: (options) => {
            return new Promise((resolve, reject) => {
                $httpClient.post(options, (error, response, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ statusCode: response.status, headers: response.headers, body: body });
                    }
                });
            });
        }
    };
    this.persistentStore = {
        read: (key) => $persistentStore.read(key),
        write: (value, key) => $persistentStore.write(value, key)
    };
    this.notification = {
        post: (title, subtitle, body) => $notification.post(title, subtitle, body)
    };
    this.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    // Add other $ functions if needed by the logic (e.g. $.log, $.time)
}


main().finally(() => {
    console.log("嘉立创每日任务执行完毕。");
    if (notificationMessages.length > 1) { // Has more than just the initial title
        $.notification.post(notificationMessages[0], // Title
            notificationMessages.slice(1, 3).join('; '), // Subtitle with first 2 messages
            notificationMessages.slice(1).join('\n')); // Body with all messages
    } else {
        $.notification.post("嘉立创每日任务", "执行完毕", "没有更多信息。");
    }
    $done();
});