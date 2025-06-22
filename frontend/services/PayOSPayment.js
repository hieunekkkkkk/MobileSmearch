import { Alert, Linking } from "react-native";

const BACKEND_API = process.env.EXPO_PUBLIC_BACKEND_URL;

class PayOSPayment {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
    }

    async pay(amount, description, userId, subscriptionPlanId) {
        try {
            description = "MMA Payment";
            await this.initialize();

            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const timestamp = Date.now() % 1000000;
            const orderCode = Number(`${timestamp}${randomNum}`.slice(-9));

            console.log('Creating PayOS payment...');

            // Sử dụng backend return URL thay vì deep link
            const returnUrl = `${BACKEND_API}/api/payos/return?status=success`;
            const cancelUrl = `${BACKEND_API}/api/payos/return?status=failed`;

            const response = await fetch(`${BACKEND_API}/api/payos/create-payment-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderCode: orderCode,
                    amount: amount,
                    description: description,
                    returnUrl: returnUrl,
                    cancelUrl: cancelUrl,
                    userId: userId,
                    subscriptionPlanId: subscriptionPlanId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const paymentData = await response.json();
            console.log('PayOS payment data received:', paymentData);

            if (paymentData.success && paymentData.checkoutUrl) {
                return this.handlePayOSPayment(paymentData.checkoutUrl, orderCode, subscriptionPlanId);
            } else {
                throw new Error('Failed to create PayOS payment');
            }

        } catch (error) {
            console.error("PayOS payment error:", error);
            return {
                success: false,
                message: `Payment initialization failed: ${error.message}`,
            };
        }
    }

    async handlePayOSPayment(checkoutUrl, orderCode, subscriptionPlanId) {
        try {
            console.log('Opening PayOS payment URL:', checkoutUrl);

            const supported = await Linking.canOpenURL(checkoutUrl);

            if (supported) {
                await Linking.openURL(checkoutUrl);

                // Happy case - backend sẽ xử lý logic revert user
                return {
                    success: true,
                    orderCode: orderCode,
                    subscriptionPlanId: subscriptionPlanId,
                    message: "Payment initiated successfully"
                };
            } else {
                throw new Error("Cannot open PayOS payment gateway");
            }
        } catch (error) {
            console.error('Error opening PayOS URL:', error);
            return {
                success: false,
                message: "Failed to open payment gateway",
            };
        }
    }
}

export const payOSPayment = new PayOSPayment();