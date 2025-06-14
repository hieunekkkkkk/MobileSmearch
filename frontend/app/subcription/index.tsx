import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Button } from "@/components/Button";
import { Colors } from "@/constants/Colors";
import { Check, CreditCard, Crown, Zap, Star } from "lucide-react-native";
import { momoPayment } from "@/services/MoMoPayment";
import Toast from "react-native-toast-message";

// 3 gói subscription cho owner role - sử dụng ID để so sánh level
const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 1,
    name: "Basic Owner",
    price: 0,
    description: "FREE plan for new business owners",
    features: [
      "Add up to 3 businesses",
      "Basic analytics",
      "Email support",
      "Standard listing",
    ],
    icon: Check,
  },
  PREMIUM: {
    id: 2,
    name: "Premium Owner",
    price: 199000,
    description: "Advanced features for growing businesses",
    features: [
      "Add up to 10 businesses",
      "Advanced analytics",
      "Priority support",
      "Featured listing",
      "Customer reviews management",
    ],
    icon: Star,
  },
  VIP: {
    id: 3,
    name: "VIP Owner",
    price: 299000,
    description: "Premium features for established businesses",
    features: [
      "Unlimited businesses",
      "Complete analytics dashboard",
      "24/7 VIP support",
      "Top featured listing",
      "Advanced business settings",
      "Marketing tools",
    ],
    icon: Crown,
  },
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS.BASIC.id);
  const [loading, setLoading] = useState(false);

  // Get current user role và subscription ID hiện tại
  const currentRole = user?.unsafeMetadata?.role as string;
  const subscription = user?.unsafeMetadata?.subscription as
    | { id?: number }
    | undefined;
  const currentSubscriptionId = subscription?.id;

  const handleSelectPlan = (planId: number) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Authentication Required",
        text2: "You must be logged in to subscribe",
        position: "top",
      });
      return;
    }

    // Check nếu đã có plan này
    if (currentSubscriptionId === selectedPlan) {
      Toast.show({
        type: "info",
        text1: "Already Subscribed",
        text2: "You are already subscribed to this plan",
        position: "top",
      });
      return;
    }

    // Check nếu trying to downgrade
    if (currentSubscriptionId && selectedPlan <= currentSubscriptionId) {
      Toast.show({
        type: "error",
        text1: "Downgrade Not Allowed",
        text2: "You can only upgrade to a higher plan",
        position: "top",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedPlanData = Object.values(SUBSCRIPTION_PLANS).find(
        (plan) => plan.id === selectedPlan
      );

      if (!selectedPlanData) {
        throw new Error("Invalid plan selected");
      }

      // Check if it's FREE plan (Basic)
      if (selectedPlanData.price === 0) {
        // FREE plan - no payment needed, direct upgrade
        console.log("FREE plan selected - no payment required");

        // Update user to owner role with FREE subscription
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            role: "owner",
            subscription: {
              id: selectedPlan,
              startDate: new Date().toISOString(),
              status: "active",
              paymentMethod: "free",
              orderId: `FREE_${Date.now()}`,
            },
          },
        });

        await user.reload();

        // Show success toast and redirect
        Toast.show({
          type: "success",
          text1: "🎉 Welcome to Basic Plan!",
          text2: `${selectedPlanData.name} is now active!`,
          position: "top",
          visibilityTime: 3000,
          onHide: () => {
            // Redirect after toast hides
            router.push("/(tabs)/add-business");
          },
        });

        // Backup redirect in case onHide doesn't work
        setTimeout(() => {
          router.push("/(tabs)/add-business");
        }, 3500);

        return; // Exit early for FREE plan
      }

      // Paid plans - proceed with payment
      const description = `Subscription ${selectedPlanData.name} - MMA Business`;

      console.log("Starting MoMo Gateway payment...");
      console.log("Payment amount:", selectedPlanData.price);
      console.log("Payment description:", description);
      console.log("User ID:", user.id);
      console.log("Subscription Plan ID:", selectedPlan);

      // Show loading toast for paid plans
      Toast.show({
        type: "info",
        text1: "Opening Payment Gateway",
        text2: "Redirecting to MoMo payment...",
        position: "top",
        autoHide: false, // Keep showing until we update it
      });

      // Call MoMo gateway payment - sẽ mở payURL ngay lập tức
      const paymentResult = await momoPayment.pay(
        selectedPlanData.price,
        description,
        user.id,
        selectedPlan
      );

      console.log("Payment result:", paymentResult);

      // Hide loading toast
      Toast.hide();

      if (paymentResult.success) {
        // Update user to owner role with subscription
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            role: "owner",
            subscription: {
              id: selectedPlan,
              startDate: new Date().toISOString(),
              status: "active",
              paymentMethod: "momo_gateway",
              orderId: paymentResult.orderId,
            },
          },
        });

        await user.reload();

        // Show success toast and redirect
        Toast.show({
          type: "success",
          text1: "🎉 Payment Successful!",
          text2: `${selectedPlanData.name} subscription is now active!`,
          position: "top",
          visibilityTime: 3000,
          onHide: () => {
            // Redirect after toast hides
            router.push("/(tabs)/add-business");
          },
        });

        // Backup redirect
        setTimeout(() => {
          router.push("/(tabs)/add-business");
        }, 3500);
      } else {
        // Payment failed - show error toast but don't redirect
        Toast.show({
          type: "error",
          text1: "💳 Payment Failed",
          text2:
            paymentResult.message ||
            "Payment was not successful. Please try again.",
          position: "top",
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);

      // Hide any existing toasts
      Toast.hide();

      // Show error toast
      Toast.show({
        type: "error",
        text1: "Subscription Error",
        text2: `Failed to process subscription: ${error}`,
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPlanCard = (
    plan: typeof SUBSCRIPTION_PLANS.BASIC,
    isSelected: boolean
  ) => {
    const IconComponent = plan.icon;
    const isCurrentPlan = currentSubscriptionId === plan.id;
    const isFree = plan.price === 0;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          isCurrentPlan && styles.currentPlanCard,
          isFree && styles.freePlanCard, // Special style for FREE plan
        ]}
        onPress={() => {
          if (!isCurrentPlan) {
            handleSelectPlan(plan.id);
          }
        }}
        activeOpacity={isCurrentPlan ? 1 : 0.8}
      >
        <View style={styles.planHeader}>
          <View style={styles.planTitleContainer}>
            <IconComponent size={24} color={Colors.primary} />
            <Text style={styles.planName}>{plan.name}</Text>
            {isFree && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>FREE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.planPrice, isFree && styles.freePrice]}>
            {isFree ? (
              <Text style={styles.freePriceText}>FREE</Text>
            ) : (
              <>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(plan.price)}
                <Text style={styles.priceperiod}>/month</Text>
              </>
            )}
          </Text>
        </View>

        <Text style={styles.planDescription}>{plan.description}</Text>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={16} color={Colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>Current Plan</Text>
          </View>
        )}

        {isSelected && !isCurrentPlan && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: currentRole === "owner" ? "Upgrade Plan" : "Upgrade to Owner",
          headerBackTitle: "Back",
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {currentRole === "owner"
              ? "Upgrade Your Plan"
              : "Become a Business Owner"}
          </Text>
          <Text style={styles.subtitle}>
            Choose a plan to start listing and managing your businesses
          </Text>
          <Text style={styles.roleInfo}>
            Current role:{" "}
            <Text style={styles.currentRoleText}>
              {currentRole || "Client"}
            </Text>
          </Text>
          {currentSubscriptionId && (
            <Text style={styles.currentPlanInfo}>
              Current plan:{" "}
              <Text style={styles.currentPlanText}>
                {Object.values(SUBSCRIPTION_PLANS).find(
                  (p) => p.id === currentSubscriptionId
                )?.name || "Unknown"}
              </Text>
            </Text>
          )}
        </View>

        <View style={styles.plansContainer}>
          {Object.values(SUBSCRIPTION_PLANS).map((plan) =>
            renderPlanCard(plan, selectedPlan === plan.id)
          )}
        </View>

        <View style={styles.paymentContainer}>
          <>
            <Text style={styles.paymentTitle}>Payment Method</Text>
            <View style={styles.paymentMethod}>
              <CreditCard size={24} color={Colors.primary} />
              <Text style={styles.paymentText}>MoMo E-Wallet</Text>
            </View>
          </>

          <Button
            title={
              loading
                ? "Processing..."
                : Object.values(SUBSCRIPTION_PLANS).find(
                    (p) => p.id === selectedPlan
                  )?.price === 0
                ? "Get FREE Plan"
                : currentRole === "owner"
                ? "Upgrade Plan"
                : "Upgrade to Owner"
            }
            onPress={handleSubscribe}
            loading={loading}
            disabled={currentSubscriptionId === selectedPlan}
            style={
              currentSubscriptionId === selectedPlan
                ? { ...styles.subscribeButton, ...styles.disabledButton }
                : styles.subscribeButton
            }
          />

          {currentSubscriptionId === selectedPlan && (
            <Text style={styles.alreadySubscribed}>
              You are already subscribed to this plan
            </Text>
          )}

          <Text style={styles.disclaimer}>
            {Object.values(SUBSCRIPTION_PLANS).find(
              (p) => p.id === selectedPlan
            )?.price === 0
              ? "You will get FREE access to business owner features."
              : `Payment will ${
                  currentRole === "owner"
                    ? "upgrade your plan"
                    : "upgrade you to Business Owner role"
                }.`}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // ...existing styles...

  // Add new styles for FREE plan
  freePlanCard: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}08`, // Light green background
  },
  freeBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  freeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  freePrice: {
    color: Colors.success,
  },
  freePriceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.success,
  },

  // ...rest of existing styles...
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  currentRoleText: {
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "capitalize",
  },
  currentPlanInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  currentPlanText: {
    fontWeight: "600",
    color: Colors.success,
  },
  plansContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: Colors.success,
    opacity: 0.8,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  planTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
  },
  priceperiod: {
    fontSize: 14,
    fontWeight: "normal",
    color: Colors.textSecondary,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  selectedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  selectedText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  currentBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  currentText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  paymentContainer: {
    padding: 20,
    marginTop: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  alreadySubscribed: {
    fontSize: 14,
    color: Colors.success,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
});
