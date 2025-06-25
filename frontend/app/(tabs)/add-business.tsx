import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useBusinessStore } from "@/store/businessStore";
import { Button } from "@/components/Button";
import { Colors } from "@/constants/Colors";
import { BusinessCategory } from "@/types";
import {
  MapPin,
  Phone,
  Camera,
  Plus,
  X,
  Package,
  Crown,
  Save,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from "expo-image";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";

const categories = [
  { id: "accommodation", label: "Hostel/Accommodation" },
  { id: "hotel", label: "Hotel" },
  { id: "restaurant", label: "Restaurant" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "gas_station", label: "Gas Station" },
];

const weekdays = [
  { id: 0, name: "Sun" },
  { id: 1, name: "Mon" },
  { id: 2, name: "Tue" },
  { id: 3, name: "Wed" },
  { id: 4, name: "Thu" },
  { id: 5, name: "Fri" },
  { id: 6, name: "Sat" },
];

interface Product {
  name: string;
  description: string;
  price: number;
  image: string;
  isAvailable: boolean;
}

export default function AddBusinessScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const {
    addBusiness,
    updateBusiness,
    fetchBusinessById,
    selectedBusiness,
    loading,
  } = useBusinessStore();

  // Edit mode detection
  const isEditMode = Boolean(editId);

  // Business fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("accommodation");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [images, setImages] = useState<string[]>([]);

  // Product fields
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState("");

  const userRole = user?.unsafeMetadata?.role as string;
  const hasOwnerSubscription = userRole === "owner";

  // Load business data for edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      fetchBusinessById(editId);
    }
  }, [editId, isEditMode, fetchBusinessById]);

  // Populate form when business data is loaded
  useEffect(() => {
    if (isEditMode && selectedBusiness) {
      setName(selectedBusiness.name || "");
      setCategory(selectedBusiness.category || "accommodation");
      setDescription(selectedBusiness.description || "");
      setAddress(selectedBusiness.address || "");
      setPhone(selectedBusiness.phone || "");
      setOpenTime(selectedBusiness.openingHours?.open || "08:00");
      setCloseTime(selectedBusiness.openingHours?.close || "22:00");
      setSelectedDays(
        selectedBusiness.openingHours?.days || [0, 1, 2, 3, 4, 5, 6]
      );
      setImages(selectedBusiness.images || []);

      // Convert products to local format
      if (selectedBusiness.products) {
        const convertedProducts = selectedBusiness.products.map((p) => ({
          name: p.name,
          description: p.description || "",
          price: p.price,
          image: p.image || "",
          isAvailable: p.isAvailable !== false,
        }));
        setProducts(convertedProducts);
      }
    }
  }, [selectedBusiness, isEditMode]);

  const handleCategorySelect = (selectedCategory: BusinessCategory) => {
    setCategory(selectedCategory);
  };

  const handleDayToggle = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((id) => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleAddImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "We need camera roll permissions to upload images",
          position: "top",
        });
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleAddProductImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "We need camera roll permissions to upload images",
          position: "top",
        });
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setProductImage(result.assets[0].uri);
    }
  };

  const handleAddProduct = () => {
    if (!productName.trim()) {
      Toast.show({
        type: "error",
        text1: "Product Name Required",
        text2: "Please enter a product name",
        position: "top",
      });
      return;
    }

    if (!productPrice || isNaN(Number(productPrice))) {
      Toast.show({
        type: "error",
        text1: "Invalid Price",
        text2: "Please enter a valid product price",
        position: "top",
      });
      return;
    }

    const newProduct: Product = {
      name: productName.trim(),
      description: productDescription.trim(),
      price: Number(productPrice),
      image:
        productImage ||
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
      isAvailable: true,
    };

    setProducts([...products, newProduct]);

    // Reset product form
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setProductImage("");
    setShowAddProduct(false);

    Toast.show({
      type: "success",
      text1: "Product Added",
      text2: `${newProduct.name} has been added successfully`,
      position: "top",
      visibilityTime: 2000,
    });
  };

  const handleRemoveProduct = (index: number) => {
    const removedProduct = products[index];
    setProducts(products.filter((_, i) => i !== index));

    Toast.show({
      type: "info",
      text1: "Product Removed",
      text2: `${removedProduct.name} has been removed`,
      position: "top",
      visibilityTime: 2000,
    });
  };

  const generateBusinessId = () => {
    return `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async () => {
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Authentication Required",
        text2: "You must be logged in to add a business",
        position: "top",
      });
      return;
    }

    // Check if user has owner subscription (skip for edit mode)
    if (!isEditMode && !hasOwnerSubscription) {
      console.log("User needs owner subscription, redirecting...");
      router.push("/subcription");
      return;
    }

    if (!name.trim() || !address.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Fields Missing",
        text2: "Business name and address are required",
        position: "top",
      });
      return;
    }

    try {
      const businessId = isEditMode ? editId : generateBusinessId();

      // Format products according to backend model
      const formattedProducts = products.map((product, index) => ({
        id: isEditMode
          ? selectedBusiness?.products?.[index]?.id ||
            `product_${businessId}_${index}`
          : `product_${businessId}_${index}`,
        businessId: businessId!,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        isAvailable: product.isAvailable,
      }));

      const result = await Location.geocodeAsync(address.trim());

      const businessData = {
        id: businessId!,
        ownerId: user.id,
        name: name.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        location:
          isEditMode && selectedBusiness?.location
            ? selectedBusiness.location
            : {
                latitude: result[0]?.latitude || 10.762622,
                longitude: result[0]?.longitude || 106.660172,
              },
        phone: phone.trim(),
        openingHours: {
          open: openTime,
          close: closeTime,
          days: selectedDays,
        },
        isOpen: isEditMode ? selectedBusiness?.isOpen ?? true : true,
        images:
          images.length > 0
            ? images
            : [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
              ],
        viewCount: isEditMode ? selectedBusiness?.viewCount ?? 0 : 0,
        rating: isEditMode ? selectedBusiness?.rating ?? 0 : 0,
        products: formattedProducts,
        createdAt: isEditMode
          ? selectedBusiness?.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditMode) {
        await updateBusiness(editId!, businessData);
      } else {
        await addBusiness(businessData);
      }

      // Show success toast and navigate
      Toast.show({
        type: "success",
        text1: isEditMode
          ? "🎉 Business Updated!"
          : "🎉 Business Added Successfully!",
        text2: `${name.trim()} has been ${
          isEditMode ? "updated" : "added to your business list"
        }`,
        position: "top",
        visibilityTime: 3000,
        onHide: () => {
          if (isEditMode) {
            router.back(); // Go back to my-business
          } else {
            // Reset form for add mode
            setName("");
            setCategory("accommodation");
            setDescription("");
            setAddress("");
            setPhone("");
            setOpenTime("08:00");
            setCloseTime("22:00");
            setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
            setImages([]);
            setProducts([]);
            setShowAddProduct(false);

            // Navigate to home tab
            router.push("/(tabs)");
          }
        },
      });

      // Backup navigation
      setTimeout(() => {
        if (isEditMode) {
          router.back();
        } else {
          // Reset form
          setName("");
          setCategory("accommodation");
          setDescription("");
          setAddress("");
          setPhone("");
          setOpenTime("08:00");
          setCloseTime("22:00");
          setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
          setImages([]);
          setProducts([]);
          setShowAddProduct(false);

          // Navigate to home tab
          router.push("/(tabs)");
        }
      }, 3500);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: `Failed to ${isEditMode ? "Update" : "Add"} Business`,
        text2: error instanceof Error ? error.message : "Something went wrong",
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  // If user doesn't have owner subscription, show upgrade prompt (only for add mode)
  if (!isEditMode && !hasOwnerSubscription) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <Stack.Screen
          options={{
            title: "Add Business",
            headerBackTitle: "Back",
          }}
        />

        <View style={styles.permissionContent}>
          <Crown
            size={64}
            color={Colors.primary}
            style={styles.subscriptionIcon}
          />
          <Text style={styles.permissionTitle}>
            Owner Subscription Required
          </Text>
          <Text style={styles.permissionText}>
            To add and manage businesses, you need an Owner subscription plan.
          </Text>
          <Text style={styles.permissionSubtext}>
            Current plan:{" "}
            <Text style={styles.roleText}>{userRole || "Client"}</Text>
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Owner Plan Benefits:</Text>
            <Text style={styles.benefitItem}>• Add unlimited businesses</Text>
            <Text style={styles.benefitItem}>• Business analytics</Text>
            <Text style={styles.benefitItem}>• Priority support</Text>
            <Text style={styles.benefitItem}>
              • Customer reviews management
            </Text>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/subcription")}
          >
            <Text style={styles.upgradeButtonText}>Get Owner Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? "Edit Business" : "Add Business",
          headerBackTitle: "Back",
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditMode ? "Edit Your Business" : "Add Your Business"}
          </Text>
          <Text style={styles.subtitle}>
            {isEditMode
              ? "Update your business details"
              : "Fill in the details to list your business"}
          </Text>
          <View style={styles.subscriptionBadge}>
            <Crown size={16} color={Colors.success} />
            <Text style={styles.subscriptionText}>Owner Plan Active</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Business Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Business Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter business name"
            />
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.selectedCategoryButton,
                  ]}
                  onPress={() =>
                    handleCategorySelect(cat.id as BusinessCategory)
                  }
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.id && styles.selectedCategoryButtonText,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter business description"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.iconInput}>
              <MapPin
                size={20}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.iconTextInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter business address"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.iconInput}>
              <Phone
                size={20}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.iconTextInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Opening Hours */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Opening Hours <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.timeContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Open</Text>
                <TextInput
                  style={styles.timeTextInput}
                  value={openTime}
                  onChangeText={setOpenTime}
                  placeholder="HH:MM"
                />
              </View>

              <View style={styles.timeSeparator}>
                <Text style={styles.timeSeparatorText}>to</Text>
              </View>

              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Close</Text>
                <TextInput
                  style={styles.timeTextInput}
                  value={closeTime}
                  onChangeText={setCloseTime}
                  placeholder="HH:MM"
                />
              </View>
            </View>
          </View>

          {/* Open Days */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Open Days <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.daysContainer}>
              {weekdays.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day.id) && styles.selectedDayButton,
                  ]}
                  onPress={() => handleDayToggle(day.id)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      selectedDays.includes(day.id) &&
                        styles.selectedDayButtonText,
                    ]}
                  >
                    {day.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Business Images */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Business Images</Text>
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imagePreview}>
                  <ExpoImage
                    source={{ uri: image }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImages(images.filter((_, i) => i !== index));
                      Toast.show({
                        type: "info",
                        text1: "Image Removed",
                        text2: "Business image has been removed",
                        position: "top",
                        visibilityTime: 2000,
                      });
                    }}
                  >
                    <X size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleAddImage}
              >
                <Camera size={24} color={Colors.primary} />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Products Section */}
          <View style={styles.inputContainer}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Products/Services</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Add products or services your business offers
            </Text>

            {/* Existing Products */}
            {products.map((product, index) => (
              <View key={index} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveProduct(index)}
                    style={styles.removeProductButton}
                  >
                    <X size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.productDescription}>
                  {product.description}
                </Text>
                <Text style={styles.productPrice}>${product.price}</Text>
              </View>
            ))}

            {/* Add Product Button */}
            {!showAddProduct && (
              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => setShowAddProduct(true)}
              >
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.addProductText}>Add Product/Service</Text>
              </TouchableOpacity>
            )}

            {/* Add Product Form */}
            {showAddProduct && (
              <View style={styles.addProductForm}>
                <View style={styles.productFormHeader}>
                  <Text style={styles.productFormTitle}>Add New Product</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddProduct(false)}
                    style={styles.cancelButton}
                  >
                    <X size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="Product name *"
                  placeholderTextColor="#9E9E9E"
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={productDescription}
                  onChangeText={setProductDescription}
                  placeholder="Product description"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9E9E9E"
                />

                <TextInput
                  style={styles.input}
                  value={productPrice}
                  onChangeText={setProductPrice}
                  placeholder="Price *"
                  keyboardType="numeric"
                  placeholderTextColor="#9E9E9E"
                />

                <View style={styles.productImageContainer}>
                  {productImage ? (
                    <View style={styles.productImageWrapper}>
                      <ExpoImage
                        source={{ uri: productImage }}
                        style={styles.productImagePreview}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeProductImageButton}
                        onPress={() => {
                          setProductImage("");
                          Toast.show({
                            type: "info",
                            text1: "Image Removed",
                            text2: "Product image has been removed",
                            position: "top",
                            visibilityTime: 2000,
                          });
                        }}
                      >
                        <X size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addProductImageButton}
                      onPress={handleAddProductImage}
                    >
                      <Camera size={24} color={Colors.primary} />
                      <Text style={styles.addImageText}>Add Product Image</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.productFormActions}>
                  <TouchableOpacity
                    style={styles.cancelProductButton}
                    onPress={() => setShowAddProduct(false)}
                  >
                    <Text style={styles.cancelProductText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveProductButton}
                    onPress={handleAddProduct}
                  >
                    <Text style={styles.saveProductText}>Add Product</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <Button
            title={isEditMode ? "Update Business" : "Add Business"}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            icon={
              isEditMode ? <Save size={18} color={Colors.white} /> : undefined
            }
          />
        </View>
      </ScrollView>
    </>
  );
}

// Keep all existing styles and add any new ones if needed
const styles = StyleSheet.create({
  // ... (keep all existing styles from previous version)
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  subscriptionIcon: {
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  permissionSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  roleText: {
    fontWeight: "600",
    color: Colors.primary,
  },
  benefitsContainer: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: "100%",
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  benefitItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
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
    marginBottom: 12,
  },
  subscriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  subscriptionText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: "600",
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000000",
    marginBottom: 12,
  },
  textArea: {
    height: 120,
  },
  categoriesContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedCategoryButtonText: {
    color: Colors.white,
    fontWeight: "500",
  },
  iconInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  iconTextInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timeTextInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  timeSeparator: {
    paddingHorizontal: 12,
  },
  timeSeparatorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.card,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDayButton: {
    backgroundColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedDayButtonText: {
    color: Colors.white,
    fontWeight: "500",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginRight: 12,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  addImageText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    textAlign: "center",
  },
  // Products Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  removeProductButton: {
    padding: 4,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  addProductText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: "500",
  },
  addProductForm: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  productFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  cancelButton: {
    padding: 4,
  },
  productImageContainer: {
    marginBottom: 16,
  },
  productImageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
  productImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeProductImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 4,
  },
  addProductImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  productFormActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelProductButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginRight: 8,
    alignItems: "center",
  },
  cancelProductText: {
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  saveProductButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginLeft: 8,
    alignItems: "center",
  },
  saveProductText: {
    color: Colors.white,
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 16,
  },
});
