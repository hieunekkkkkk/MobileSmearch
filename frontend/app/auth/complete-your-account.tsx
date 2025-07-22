import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";

import TextInput from "@/components/Forms/TextInput";
import RadioButtonInput from "@/components/Forms/RadioButtionInput";

interface FormData {
  full_name: string;
  username: string;
  gender: string;
  role: string;
}

const CompleteYourAccountScreen = () => {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { control, handleSubmit, setError, setValue } = useForm<FormData>({
    defaultValues: {
      full_name: "",
      username: "",
      gender: "",
      role: "client",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const { full_name, username, gender, role } = data;

    try {
      setIsLoading(true);
      console.log("Completing onboarding with data:", {
        full_name,
        username,
        gender,
        role,
      });

      await user?.update({
        username,
        firstName: full_name.split(" ")[0],
        lastName: full_name.split(" ").slice(1).join(" ") || "",
        unsafeMetadata: {
          ...user.unsafeMetadata,
          gender,
          role,
          onboarding_completed: true,
        },
      });

      await user?.reload();
      console.log("User updated successfully:", user?.unsafeMetadata);

      // Thêm delay nhỏ trước khi navigate
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      if (
        error.message?.includes("username is taken") ||
        error.message?.includes("That username is taken")
      ) {
        setError("username", { message: "Username is already taken" });
      } else {
        setError("full_name", { message: "An unexpected error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      setValue("full_name", user.fullName || "");
      setValue("username", user.username || "");
      setValue("gender", String(user.unsafeMetadata?.gender) || "");
      setValue("role", String(user.unsafeMetadata?.role) || "client");
    }
  }, [isLoaded, user, setValue]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.headingContainer}>
        <Text style={styles.label}>Complete your account</Text>
        <Text style={styles.description}>
          Complete your account to start using the app
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          control={control}
          placeholder="Enter your full name"
          label="Full Name"
          required
          name="full_name"
        />

        <TextInput
          control={control}
          placeholder="Enter your username"
          label="Username"
          required
          name="username"
        />

        <RadioButtonInput
          control={control}
          placeholder="Select your gender"
          label="Gender"
          required
          name="gender"
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
          ]}
        />

        <RadioButtonInput
          control={control}
          placeholder="Select your role"
          label="Account Type"
          required
          name="role"
          options={[
            { label: "Customer", value: "client" },
            { label: "Business Owner", value: "owner" },
            { label: "Administrator", value: "admin" },
          ]}
        />

        <View style={{ marginTop: 20 }}>
          <TouchableOpacity
            style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : null}
            <Text style={styles.buttonText}>
              {isLoading ? "Loading..." : "Complete Account"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CompleteYourAccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    gap: 20,
  },
  headingContainer: {
    width: "100%",
    gap: 5,
  },
  label: {
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    color: "gray",
  },
  formContainer: {
    width: "100%",
    marginTop: 20,
    gap: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonText: {
    color: "white",
  },
});
