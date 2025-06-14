import { Alert, Linking } from "react-native";

const BACKEND_API = process.env.EXPO_PUBLIC_BACKEND_URL; // Backend URL

class MoMoPayment {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    // No initialization needed for gateway payment
    this.isInitialized = true;
  }

  async pay(amount, description, userId, subscriptionPlanId) {
    try {
      await this.initialize();

      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('Creating MoMo payment via gateway...');
      console.log('Payment details:', { orderId, amount, description, userId, subscriptionPlanId });

      // Call backend to create MoMo payment
      const response = await fetch(`${BACKEND_API}/api/payment/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          amount: amount,
          orderInfo: description,
          userId: userId,
          subscriptionPlanId: subscriptionPlanId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const paymentData = await response.json();
      console.log('MoMo payment data received:', paymentData);

      // Check response from MoMo
      if (paymentData.resultCode === 0 && paymentData.payUrl) {
        // Mở MoMo payment URL ngay lập tức
        return this.handleGatewayPayment(paymentData.payUrl, orderId);
      } else {
        throw new Error(paymentData.message || 'Failed to create MoMo payment');
      }

    } catch (error) {
      console.error("MoMo gateway payment error:", error);

      // Fallback to mock in development
      if (__DEV__) {
        console.log('Falling back to mock payment');
        return this.mockPayment(amount, description, userId, subscriptionPlanId);
      }

      return {
        success: false,
        message: `Payment initialization failed: ${error.message}`,
      };
    }
  }

  async handleGatewayPayment(payUrl, orderId) {
    try {
      // Mở MoMo payment URL ngay lập tức
      console.log('Opening MoMo payment URL:', payUrl);

      const supported = await Linking.canOpenURL(payUrl);

      if (supported) {
        await Linking.openURL(payUrl);

        // Đợi user quay lại và check payment status
        return this.waitForPaymentResult(orderId);
      } else {
        throw new Error("Cannot open MoMo payment gateway");
      }
    } catch (error) {
      console.error('Error opening MoMo URL:', error);
      return {
        success: false,
        message: "Failed to open payment gateway",
      };
    }
  }

  async waitForPaymentResult(orderId) {
    return new Promise((resolve) => {
      // Hiển thị alert sau khi đã mở MoMo
      Alert.alert(
        "Complete Your Payment",
        "You have been redirected to MoMo. Please complete your payment and return to confirm.",
        [
          {
            text: "Payment Failed",
            style: "destructive",
            onPress: () => {
              resolve({
                success: false,
                message: "Payment failed",
              });
            },
          },
          {
            text: "Check Status",
            onPress: () => {
              this.checkPaymentStatus(orderId, resolve);
            },
          },
          {
            text: "Payment Completed",
            onPress: () => {
              // Check với backend để confirm
              this.checkPaymentStatus(orderId, resolve, true);
            },
          },
        ]
      );
    });
  }

  async checkPaymentStatus(orderId, resolve, expectSuccess = false) {
    try {
      console.log('Checking payment status for order:', orderId);

      const response = await fetch(`${BACKEND_API}/api/payment/status/${orderId}`);

      if (response.ok) {
        const statusData = await response.json();
        console.log('Payment status:', statusData);

        if (statusData.status === 'success') {
          resolve({
            success: true,
            orderId: orderId,
            subscriptionPlanId: statusData.subscriptionPlanId
          });
        } else if (statusData.status === 'failed') {
          resolve({
            success: false,
            message: "Payment failed",
          });
        } else {
          // Still pending
          if (expectSuccess) {
            Alert.alert(
              "Payment Pending",
              "Your payment is still being processed. Please wait a moment and try again.",
              [
                {
                  text: "Check Again",
                  onPress: () => {
                    setTimeout(() => {
                      this.checkPaymentStatus(orderId, resolve);
                    }, 3000);
                  }
                },
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => {
                    resolve({
                      success: false,
                      message: "Payment verification cancelled",
                    });
                  }
                }
              ]
            );
          } else {
            // Quay lại đợi user confirm
            this.waitForPaymentResult(orderId).then(resolve);
          }
        }
      } else {
        // Không check được status, quay lại đợi user
        this.waitForPaymentResult(orderId).then(resolve);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Fallback quay lại đợi user
      this.waitForPaymentResult(orderId).then(resolve);
    }
  }

  // Mock payment for development
  async mockPayment(amount, description, userId, subscriptionPlanId) {
    const orderId = `MOCK_ORDER_${Date.now()}`;

    return new Promise((resolve) => {
      Alert.alert(
        "Mock Payment (Development)",
        `💳 DEMO MODE\n\nAmount: ${new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(amount)}\n\nDescription: ${description}\n\nOrder ID: ${orderId}\n\n✨ This is a demo payment for testing purposes`,
        [
          {
            text: "❌ Cancel Payment",
            style: "cancel",
            onPress: () => {
              resolve({
                success: false,
                message: "Payment cancelled",
              });
            },
          },
          {
            text: "💸 Simulate Failed",
            style: "destructive",
            onPress: () => {
              resolve({
                success: false,
                message: "Demo payment failed",
              });
            },
          },
          {
            text: "✅ Simulate Success",
            onPress: () => {
              resolve({
                success: true,
                orderId: orderId,
                subscriptionPlanId: subscriptionPlanId
              });
            },
          },
        ]
      );
    });
  }
}

export const momoPayment = new MoMoPayment();