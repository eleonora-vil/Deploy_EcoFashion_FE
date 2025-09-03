import React, { useState, useEffect, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  materialCreationFormRequestSchema,
  MaterialCreationFormRequest,
} from "../../schemas/materialSchema";
import { useAuthStore } from "../../store/authStore";
import { useMaterialTypes } from "../../hooks/useMaterialTypes";
import { useCountries } from "../../hooks/useCountries";
import { useTransportDetails } from "../../hooks/useTransportDetails";
import { useCreateMaterial } from "../../hooks/useCreateMaterial";
import { useUploadMaterialImages } from "../../hooks/useUploadMaterialImages";
import {
  PlusIcon,
  UploadIcon,
  SaveIcon,
  CancelIcon,
} from "../../assets/icons/index.tsx";
import { ApiError } from "../../services/api/baseApi";
import { MapRegionPicker } from "../../components/materials/MapRegionPicker";

// Toast notification component
const Toast: React.FC<{
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${bgColor} min-w-80 max-w-md transform transition-all duration-300 ease-in-out`}
      style={{
        animation: "slideIn 0.3s ease-out",
        transform: "translateX(0)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Material Type Selector Component with Images
const MaterialTypeSelector: React.FC<{
  materialTypes: any[];
  selectedTypeId: number;
  onSelect: (typeId: number) => void;
  error?: string;
}> = ({ materialTypes, selectedTypeId, onSelect, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedType = materialTypes.find(
    (type) => type.typeId === selectedTypeId
  );

  const filteredTypes = materialTypes.filter(
    (type) =>
      type.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.category &&
        type.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (typeId: number) => {
    onSelect(typeId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      {/* Selected Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`form-select cursor-pointer flex items-center gap-3 p-3 ${error ? "form-select-error border-red-300" : "border-gray-300"
          } rounded-lg focus:border-brand-500 focus:ring-brand-500 bg-white`}
      >
        {selectedType ? (
          <>
            <img
              src={
                selectedType.imageUrl ||
                "https://res.cloudinary.com/dguz8gz6s/image/upload/v1754826927/organic-coton_b9zo4y.webp"
              }
              alt={selectedType.typeName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
              onError={(e) => {
                console.log(
                  "Image failed to load for:",
                  selectedType.typeName,
                  "URL:",
                  selectedType.imageUrl
                );
                e.currentTarget.src =
                  "https://res.cloudinary.com/dguz8gz6s/image/upload/v1754826927/organic-coton_b9zo4y.webp";
              }}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {selectedType.typeName}
              </div>
              {selectedType.category && (
                <div className="text-xs text-gray-500">
                  {selectedType.category}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 text-gray-500">Chọn loại vật liệu</div>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm loại vật liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredTypes.length > 0 ? (
              filteredTypes.map((type) => (
                <div
                  key={type.typeId}
                  onClick={() => handleSelect(type.typeId)}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${selectedTypeId === type.typeId
                    ? "bg-brand-50 border-r-2 border-brand-500"
                    : ""
                    }`}
                >
                  <img
                    src={
                      type.imageUrl ||
                      "https://res.cloudinary.com/dguz8gz6s/image/upload/v1754826927/organic-coton_b9zo4y.webp"
                    }
                    alt={type.typeName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      console.log(
                        "Dropdown image failed to load for:",
                        type.typeName,
                        "URL:",
                        type.imageUrl
                      );
                      e.currentTarget.src =
                        "https://res.cloudinary.com/dguz8gz6s/image/upload/v1754826927/organic-coton_b9zo4y.webp";
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {type.typeName}
                    </div>
                    {type.category && (
                      <div className="text-xs text-gray-500">
                        {type.category}
                      </div>
                    )}
                    {type.description && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {type.description}
                      </div>
                    )}
                  </div>
                  {selectedTypeId === type.typeId && (
                    <svg
                      className="w-5 h-5 text-brand-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-sm">Không tìm thấy loại vật liệu phù hợp</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="form-error text-xs text-red-500 mt-1">{error}</p>}

      {/* Click Outside Handler */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

// Sustainability certification mapping with backend IDs
// NOTE: CriterionId 1-5 are reserved for core metrics (Carbon, Water, Waste, Organic, Transport)
// Certifications use CriterionId 6+ to avoid conflicts
const SUSTAINABILITY_CERTIFICATIONS = {
  // Available certifications - Map to "Organic Certification" (CriterionId: 4)
  GOTS: { criterionId: 4 },
  "OEKO-TEX": { criterionId: 4 },
  "CRADLE TO CRADLE": { criterionId: 4 },
  CARBONNEUTRAL: { criterionId: 4 },
};

type SustainabilityCertification = keyof typeof SUSTAINABILITY_CERTIFICATIONS;
type SustainabilityCriterion = { criterionId: number; value: number };

const AddMaterial: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedCertifications, setSelectedCertifications] = useState<
    Set<SustainabilityCertification>
  >(new Set());
  const [certificateDocumentUrls, setCertificateDocumentUrls] = useState<
    Record<string, string>
  >({});
  const [transportTooltip, setTransportTooltip] = useState<{
    distance: number;
    method: string;
    description: string;
  } | null>(null);
  const [availableTransportMethods, setAvailableTransportMethods] = useState<
    any[]
  >([]);
  const [customManufacturingProcess, setCustomManufacturingProcess] = useState<string>("");
  const supplierId = useAuthStore((s) => s.supplierProfile?.supplierId);
  const loadUserProfile = useAuthStore((s) => s.loadUserProfile);
  // React Query hooks for data fetching
  const {
    data: materialTypes = [],
    isLoading: isLoadingTypes,
    error: typesError,
  } = useMaterialTypes();
  const {
    data: countries = [],
    isLoading: isLoadingCountries,
    error: countriesError,
  } = useCountries();
  // Mutation hooks
  const createMaterialMutation = useCreateMaterial();
  const uploadImagesMutation = useUploadMaterialImages();
  const isLoadingData = isLoadingTypes || isLoadingCountries;
  const hasError = typesError || countriesError;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError,
  } = useForm<MaterialCreationFormRequest>({
    resolver: zodResolver(materialCreationFormRequestSchema) as any,
    defaultValues: {
      supplierId: supplierId ?? "",
      typeId: 0,
      name: "",
      description: "",
      recycledPercentage: 0,
      quantityAvailable: 1, // Changed from 0 to meet min validation
      pricePerUnit: 1, // Changed from 0 to meet min validation
      documentationUrl: "",
      carbonFootprint: undefined,
      waterUsage: undefined,
      wasteDiverted: undefined,
      productionCountry: "",
      productionRegion: "",
      manufacturingProcess: "",
      certificationDetails: "",
      transportDistance: null,
      transportMethod: "",
      sustainabilityCriteria: [] as SustainabilityCriterion[],
    },
  });

  // Watch productionCountry to preview transport details
  const productionCountry = watch("productionCountry");
  const { data: transportPreview, isLoading: isLoadingTransport } =
    useTransportDetails(productionCountry || null);

  // Watch selected material type to check if it's organic
  const selectedTypeId = watch("typeId");
  const selectedMaterialType = materialTypes.find(
    (type) => type.typeId === selectedTypeId
  );
  const isOrganicMaterial = selectedMaterialType?.typeName
    ?.toLowerCase()
    .includes("organic") || false;

  // Ensure supplierId is synced into form for schema validation (uuid required)
  useEffect(() => {
    if (supplierId) {
      setValue("supplierId", supplierId);
    }
  }, [supplierId, setValue]);

  // Load supplier profile if missing (to obtain SupplierId GUID)
  useEffect(() => {
    if (!supplierId) {
      try {
        loadUserProfile();
      } catch { }
    }
  }, [supplierId, loadUserProfile]);

  // Add toast function
  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  // Remove toast function
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Lock form for 5 minutes after successful submission
  const lockForm = () => {
    setIsLocked(true);
    setCountdown(300); // 5 minutes = 300 seconds

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format countdown time
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Professional certification management
  const handleCertificationToggle = (
    certification: SustainabilityCertification
  ) => {
    const newSelectedCertifications = new Set(selectedCertifications);

    if (newSelectedCertifications.has(certification)) {
      newSelectedCertifications.delete(certification);
      // Remove URL when unchecking certification
      setCertificateDocumentUrls((prev) => {
        const newUrls = { ...prev };
        delete newUrls[certification];
        return newUrls;
      });
    } else {
      newSelectedCertifications.add(certification);
    }

    setSelectedCertifications(newSelectedCertifications);

    // Tạo sustainability criteria cho từng chứng chỉ được chọn
    const sustainabilityCriteria: SustainabilityCriterion[] = [];

    // Nếu có ít nhất 1 chứng chỉ được chọn, tạo entry cho Organic Certification (CriterionId: 4)
    if (newSelectedCertifications.size > 0) {
      sustainabilityCriteria.push({
        criterionId: 4, // Organic Certification from seeder - đại diện cho việc có chứng chỉ
        value: 100, // 100 = has certification, 0 = no certification
      });
    }

    setValue("sustainabilityCriteria", sustainabilityCriteria);

    // ALSO set certificationDetails string for backend business logic
    // Backend checks certificationDetails string for keywords like "GOTS", "OEKO-TEX", "CRADLE TO CRADLE", etc.
    const certificationNames = Array.from(newSelectedCertifications).join(", ");
    setValue("certificationDetails", certificationNames || "");
  };

  // Compute allowed certifications based on Waste Diverted thresholds
  const wasteDivertedValue = watch("wasteDiverted") ?? 0;
  const getAllowedCertifications = (
    wastePct: number
  ): SustainabilityCertification[] => {
    const allowed: SustainabilityCertification[] = [];

    // Updated logic: only Cradle to Cradle for Waste Diverted >= 75%
    if (wastePct >= 75) {
      allowed.push("CRADLE TO CRADLE");
    }

    return allowed;
  };
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // Carbon Footprint-based unlocking and suggestions
  const carbonFootprintValue = watch("carbonFootprint") ?? 0;
  const getCarbonBasedUnlockedCertifications = (
    carbonPerMeter: number
  ): SustainabilityCertification[] => {
    const unlocked: SustainabilityCertification[] = [];
    if (carbonPerMeter > 0 && carbonPerMeter <= 5) {
      unlocked.push("CARBONNEUTRAL");
    }
    return unlocked;
  };
  const getCarbonBasedSuggestedCertifications = (
    carbonPerMeter: number
  ): SustainabilityCertification[] => {
    // Không còn chứng chỉ gợi ý nào
    return [];
  };

  // Get certifications allowed by organic material type
  const getOrganicCertifications = (): SustainabilityCertification[] => {
    return isOrganicMaterial ? ["GOTS"] : [];
  };

  // Combine both waste-based and organic-based certifications
  const getCombinedAllowedCertifications = (
    wastePct: number
  ): SustainabilityCertification[] => {
    const wasteBasedCertifications = getAllowedCertifications(wastePct);
    const organicBasedCertifications = getOrganicCertifications();
    return [...wasteBasedCertifications, ...organicBasedCertifications];
  };

  const allowedCertificationSet = useMemo(
    () => new Set([
      ...getCombinedAllowedCertifications(Number(wasteDivertedValue) || 0),
      ...getCarbonBasedUnlockedCertifications(Number(carbonFootprintValue) || 0),
      ...getCarbonBasedSuggestedCertifications(Number(carbonFootprintValue) || 0),
      // Thêm các chứng chỉ luôn có thể chọn
      "OEKO-TEX"
    ]),
    [wasteDivertedValue, carbonFootprintValue, isOrganicMaterial]
  );

  // Prune previously selected certifications if they are no longer allowed
  useEffect(() => {
    const currentAllowed = allowedCertificationSet;
    const hasInvalid = Array.from(selectedCertifications).some(
      (cert) => !currentAllowed.has(cert)
    );
    if (hasInvalid) {
      const pruned = new Set(
        Array.from(selectedCertifications).filter((cert) =>
          currentAllowed.has(cert)
        )
      );
      setSelectedCertifications(pruned);

      const hasCertification = pruned.size > 0;
      const sustainabilityCriteria: SustainabilityCriterion[] = hasCertification
        ? [
          {
            criterionId: 4,
            value: 100,
          },
        ]
        : [];
      setValue("sustainabilityCriteria", sustainabilityCriteria);
      setValue(
        "certificationDetails",
        hasCertification ? Array.from(pruned).join(", ") : ""
      );
    }
  }, [allowedCertificationSet]);

  // Get all available certifications
  const getAllCertifications = (): SustainabilityCertification[] => {
    return Object.keys(SUSTAINABILITY_CERTIFICATIONS) as SustainabilityCertification[];
  };

  // Check if a certification is enabled based on current form data
  const isCertificationEnabled = (certification: SustainabilityCertification): boolean => {
    // Các chứng chỉ luôn có thể chọn
    const alwaysAvailable: SustainabilityCertification[] = ["OEKO-TEX"];
    if (alwaysAvailable.includes(certification)) {
      return true;
    }
    return allowedCertificationSet.has(certification);
  };

  // Get the reason why a certification is disabled
  const getDisabledReason = (certification: SustainabilityCertification): string => {
    // Các chứng chỉ luôn có thể chọn không có lý do bị disable
    const alwaysAvailable: SustainabilityCertification[] = ["OEKO-TEX"];
    if (alwaysAvailable.includes(certification)) {
      return "";
    }

    const wasteValue = Number(wasteDivertedValue) || 0;
    const carbonValue = Number(carbonFootprintValue) || 0;

    switch (certification) {
      case "CRADLE TO CRADLE":
        return wasteValue < 75 ? `Cần Waste Diverted ≥ 75% (hiện tại: ${wasteValue}%)` : "";
      case "CARBONNEUTRAL":
        return carbonValue > 5 ? `Cần Carbon Footprint ≤ 5 kgCO₂e/mét (hiện tại: ${carbonValue})` : "";
      case "GOTS":
        return !isOrganicMaterial ? "Cần chọn loại vật liệu Organic" : "";
      default:
        return "";
    }
  };

  // Fetch transport details when country changes
  const fetchTransportDetails = async (country: string) => {
    if (!country) {
      setTransportTooltip(null);
      setAvailableTransportMethods([]);
      return;
    }

    try {
      // Fetch transport calculation details
      const transportResponse = await fetch(
        `${API_BASE_URL}/api/Material/CalculateTransport/${encodeURIComponent(country)}`
      );
      if (transportResponse.ok) {
        const transportData = await transportResponse.json();
        setTransportTooltip({
          distance: transportData.distance,
          method: transportData.method,
          description: transportData.description,
        });

        // Auto-fill recommended values
        setValue("transportDistance", transportData.distance);
        setValue("transportMethod", transportData.method);
      }

      // Fetch available transport methods
      const methodsResponse = await fetch(
        `${API_BASE_URL}/api/Material/GetAvailableTransportMethods?country=${encodeURIComponent(
          country
        )}`
      );
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        setAvailableTransportMethods(methodsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching transport details:", error);
       addToast("Lỗi tải thông tin vận chuyển", "error");
    }
  };

  // Handle country selection change
  const handleCountryChange = (selectedCountry: string) => {
    setValue("productionCountry", selectedCountry);
    fetchTransportDetails(selectedCountry);
  };

  const onSubmit: SubmitHandler<MaterialCreationFormRequest> = async (data) => {
    if (isSubmitting) return; // Prevent spam
    // Backend will override SupplierId from claims; allow submit even if supplierId chưa load

    // Validate certificate URLs if certificates are selected
    if (selectedCertifications.size > 0) {
      const missingUrls: string[] = [];
      Array.from(selectedCertifications).forEach((cert) => {
        const url = certificateDocumentUrls[cert];
        if (!url || url.trim() === "") {
          missingUrls.push(cert);
        }
      });

      if (missingUrls.length > 0) {
        addToast(
          `Vui lòng cung cấp đường dẫn chứng chỉ cho: ${missingUrls.join(
            ", "
          )}`,
          "error"
        );
        return;
      }
    }

    // Validate custom manufacturing process when selected
    const selectedProcess = data.manufacturingProcess;
    let effectiveManufacturingProcess = selectedProcess;
    if (selectedProcess === "custom") {
      effectiveManufacturingProcess = customManufacturingProcess.trim();
      if (!effectiveManufacturingProcess) {
        setError("manufacturingProcess", { type: "manual", message: "Vui lòng nhập quy trình sản xuất" });
        addToast("Vui lòng nhập quy trình sản xuất khi chọn 'Khác'", "error");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Add delay to prevent spam
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check authentication status
      const token = localStorage.getItem("authToken");
      if (!token) {
        addToast("Vui lòng đăng nhập để tạo vật liệu", "error");
        return;
      }

      // Ensure supplierId present
      const supplierGuid = supplierId ?? "";
      const payload: MaterialCreationFormRequest = {
        ...data,
        supplierId: supplierGuid,
        manufacturingProcess: effectiveManufacturingProcess || undefined,
        // Add missing fields that backend expects
        isCertified: false,
        hasOrganicCertification: false,
        organicCertificationType: null,
        qualityStandards: null,
        isAvailable: false, // Backend will override to false for new materials
        // Add default certificationExpiryDate +30 days from now
        certificationExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        // Convert certificate URLs array to string format for backend
        documentationUrl:
          Object.values(certificateDocumentUrls)
            .filter((url) => url.trim() !== "")
            .join(" | ") || "",
        // Ensure sustainabilityCriteria is an array
        sustainabilityCriteria: data.sustainabilityCriteria || [],
        // Keep transport fields from form data (if any) - backend will handle auto-calculation or override
        transportDistance: data.transportDistance,
        transportMethod: data.transportMethod,
      };

      addToast("Đang tạo vật liệu mới...", "info");

      const creation = await createMaterialMutation.mutateAsync(payload);

      addToast("Vật liệu đã được tạo thành công!", "success");

      // Upload images if any
      if (uploadedFiles.length > 0) {
        try {
          addToast("Đang tải lên hình ảnh...", "info");

          await uploadImagesMutation.mutateAsync({
            materialId: creation.materialId,
            files: uploadedFiles,
          });

          addToast(
            `${uploadedFiles.length} hình ảnh đã được tải lên thành công!`,
            "success"
          );
        } catch (e) {
          console.warn("Upload images failed:", e);
          addToast(
            "Lỗi tải lên hình ảnh. Vật liệu đã được tạo nhưng không có hình ảnh.",
            "error"
          );
        }
      }

      // Final success message
      setTimeout(() => {
        addToast(
          "Vật liệu của bạn sẽ được admin duyệt trước khi lên kệ hàng.",
          "info"
        );
      }, 1000);

      // Lock form and reset after successful submission
      lockForm();
      setTimeout(() => {
        reset();
        setUploadedFiles([]);
        setCustomManufacturingProcess("");
      }, 2000);
    } catch (error) {
      console.error("Error creating material:", error);
      if (error instanceof ApiError) {
        const message = error.message || "Lỗi tạo vật liệu.";
        // Bắt lỗi trùng tên từ backend và hiển thị ngay tại field Name (đã xóa)
        if (message.toLowerCase().includes("cùng tên")) {
          setError("name", { type: "server", message });
          addToast(message, "error");
        } else {
          addToast(message, "error");
        }
      } else {
        addToast("Lỗi tạo vật liệu. Vui lòng thử lại.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Filter only image files
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const nonImageCount = files.length - imageFiles.length;
    if (nonImageCount > 0) {
      addToast(
        `${nonImageCount} tệp không phải hình ảnh đã bị bỏ qua.`,
        "info"
      );
    }

    setUploadedFiles((prev) => {
      if (prev.length >= 3) {
        addToast("Bạn chỉ có thể tải tối đa 3 ảnh.", "error");
        return prev;
      }

      const remainingSlots = 3 - prev.length;
      const filesToAdd = imageFiles.slice(0, remainingSlots);

      if (imageFiles.length > remainingSlots) {
        addToast(
          `Chỉ có thể thêm ${remainingSlots} ảnh nữa (tối đa 3).`,
          "error"
        );
      }

      return [...prev, ...filesToAdd];
    });

    // Reset input value to allow re-selecting the same file if needed
    event.currentTarget.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate and cleanup preview URLs when uploadedFiles changes
  useEffect(() => {
    const urls = uploadedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploadedFiles]);

  return (
    <>
      <style>{`
       @keyframes slideIn {
         from {
           transform: translateX(100%);
           opacity: 0;
         }
         to {
           transform: translateX(0);
           opacity: 1;
         }
       }
     `}</style>
      <div className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-content">
            {/* Header */}
            <div className="dashboard-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="dashboard-title">Thêm Vật Liệu Mới</h1>
                  <p className="dashboard-subtitle">
                    Tạo danh sách vật liệu mới cho kho hàng của bạn
                  </p>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Lưu ý:</span> Vật liệu mới có cấp chứng chỉ cần xác thực
                        ,cần thời gian để chuyên gia trong ngành duyệt trước khi lên kệ hàng
                      </p>
                    </div>
                  </div>

                  {/* Countdown Lock Notification */}
                  {isLocked && countdown > 0 && (
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-orange-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-orange-800">
                          <span className="font-medium">Tạm khóa:</span> Vui
                          lòng chờ{" "}
                          <span className="font-bold text-orange-900">
                            {formatCountdown(countdown)}
                          </span>{" "}
                          trước khi thêm vật liệu mới
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.history.back()}
                    className="btn-secondary"
                  >
                    <CancelIcon className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingData && (
              <div className="dashboard-card">
                <div className="card-body text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    Đang tải loại vật liệu và quốc gia...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {hasError && !isLoadingData && (
              <div className="dashboard-card">
                <div className="card-body text-center py-8">
                  <div className="text-red-500 mb-4">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Không thể tải dữ liệu
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasError?.message || "Đã xảy ra lỗi không xác định"}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            {!isLoadingData && !hasError && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* hidden supplierId field for validation binding */}
                <input type="hidden" {...register("supplierId")} />
                {/* Basic Information */}
                <div className="dashboard-card mb-8 rounded-xl shadow-md border border-gray-200 bg-white dark:bg-gray-900">
                  <div className="card-header px-6 pt-6 pb-2">
                    <h3 className="card-title text-lg font-bold text-brand-700">
                      Thông Tin Cơ Bản
                    </h3>
                    <p className="card-subtitle text-sm text-gray-500">
                      Chi tiết cơ bản về vật liệu
                    </p>
                  </div>
                  <div className="card-body px-6 pb-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Material Name */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Tên Vật Liệu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register("name")}
                          className={`form-input ${errors.name ? "form-input-error" : ""
                            } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                          placeholder="Nhập tên vật liệu"
                        />
                        {errors.name && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      {/* Material Type with Custom Dropdown */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Loại Vật Liệu <span className="text-red-500">*</span>
                        </label>
                        <MaterialTypeSelector
                          materialTypes={materialTypes}
                          selectedTypeId={watch("typeId")}
                          onSelect={(typeId) => setValue("typeId", typeId)}
                          error={errors.typeId?.message}
                        />
                      </div>

                      {/* Description */}
                      <div className="form-group md:col-span-2">
                        <label className="form-label font-semibold text-gray-800">
                          Mô Tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          {...register("description")}
                          rows={4}
                          className={`form-textarea ${errors.description ? "form-textarea-error" : ""
                            } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                          placeholder="Mô tả vật liệu, tính chất và lợi ích"
                        />
                        {errors.description && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      {/* Price Per Unit */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Giá (VNĐ/mét) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            ₫
                          </span>
                          <input
                            type="number"
                            {...register("pricePerUnit", {
                              valueAsNumber: true,
                            })}
                            className={`form-input pl-8 ${errors.pricePerUnit ? "form-input-error" : ""
                              } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                            placeholder="VD: 50000 = 50 000 VNĐ/mét"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {errors.pricePerUnit && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.pricePerUnit.message}
                          </p>
                        )}
                      </div>

                      {/* Unit */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Đơn Vị <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            className={`form-input rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                            value=" VNĐ/mét"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sustainability Metrics */}
                <div className="dashboard-card mb-8 rounded-xl shadow-md border border-gray-200 bg-white dark:bg-gray-900">
                  <div className="card-header px-6 pt-6 pb-2">
                    <h3 className="card-title text-lg font-bold text-brand-700">
                      Chỉ Số Bền Vững (3/5 Tiêu Chí Đánh Giá Sustainability
                      Score)
                    </h3>
                    <p className="card-subtitle text-sm text-gray-500">
                      Các chỉ số đánh giá tính bền vững
                    </p>
                  </div>
                  <div className="card-body px-6 pb-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Carbon Footprint */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Carbon Footprint (kgCO2e/mét){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          {...register("carbonFootprint", {
                            valueAsNumber: true,
                          })}
                          className={`form-input ${errors.carbonFootprint ? "form-input-error" : ""
                            } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errors.carbonFootprint && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.carbonFootprint.message}
                          </p>
                        )}
                      </div>

                      {/* Water Usage */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Water Usage (lít/mét){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          {...register("waterUsage", { valueAsNumber: true })}
                          className={`form-input ${errors.waterUsage ? "form-input-error" : ""
                            } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errors.waterUsage && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.waterUsage.message}
                          </p>
                        )}
                      </div>

                      {/* Waste Diverted */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Waste Diverted (%){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          {...register("wasteDiverted", {
                            valueAsNumber: true,
                          })}
                          className={`form-input ${errors.wasteDiverted ? "form-input-error" : ""
                            } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                        {errors.wasteDiverted && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.wasteDiverted.message}
                          </p>
                        )}
                        {!errors.wasteDiverted && (
                          <p className="text-xs text-gray-500 mt-1">
                            {Number(wasteDivertedValue) >= 75
                              ? "Đã mở từ Waste Diverted: Cradle to Cradle"
                              : "Tăng Waste Diverted lên ≥75% để mở chứng chỉ Cradle to Cradle."}
                            {isOrganicMaterial && (
                              <span className="text-green-600 font-medium">
                                {" "} + GOTS (từ vật liệu Organic)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production & Certification */}
                <div className="dashboard-card mb-8 rounded-xl shadow-md border border-gray-200 bg-white dark:bg-gray-900">
                  <div className="card-header px-6 pt-6 pb-2">
                    <h3 className="card-title text-lg font-bold text-brand-700">
                      Sản Xuất & Chứng Chỉ (2/5 Tiêu Chí Đánh Giá Sustainability
                      Score)
                    </h3>
                    <p className="card-subtitle text-sm text-gray-500">
                      Thông tin sản xuất và chứng chỉ bền vững có ảnh hưởng đến
                      việc đánh giá tính bền vững của vật liệu
                    </p>
                  </div>
                  <div className="card-body px-6 pb-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Production Country */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Quốc Gia Sản Xuất{" "}
                          <span className="text-red-500">*</span>
                          {transportTooltip && (
                            <div className="inline-block ml-2 relative group">
                              <svg
                                className="w-4 h-4 text-blue-500 cursor-help"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-6 bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                <div className="font-medium">
                                  🚚 Thông tin vận chuyển:
                                </div>
                                <div>
                                  📏 Khoảng cách: {transportTooltip.distance} km
                                </div>
                                <div>
                                  🚢 Phương thức đề xuất:{" "}
                                  {transportTooltip.method}
                                </div>
                                <div className="text-gray-300 mt-1">
                                  {transportTooltip.description}
                                </div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                              </div>
                            </div>
                          )}
                        </label>
                        <select
                          {...register("productionCountry")}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className={`form-select ${errors.productionCountry ? "form-select-error" : ""
                            }`}
                        >
                          <option value="">Chọn quốc gia</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        {errors.productionCountry && (
                          <p className="form-error">
                            {errors.productionCountry.message}
                          </p>
                        )}

                        {/* Transport preview info */}
                        {transportTooltip && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="font-medium text-blue-800">
                                Vận chuyển từ {watch("productionCountry")}:{" "}
                                {transportTooltip.distance} km -{" "}
                                {transportTooltip.method}
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              {transportTooltip.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dynamic MapRegionPicker for all supported countries */}
                      {watch("productionCountry") && (
                        <div className="form-group md:col-span-2 my-6">
                          <MapRegionPicker
                            country={watch("productionCountry")}
                            selectedRegion={watch("productionRegion")}
                            onSelectRegion={(region) =>
                              setValue("productionRegion", region)
                            }
                          />
                        </div>
                      )}

                      {/* Production Region - Manual Input */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Khu Vực Sản Xuất
                          {watch("productionRegion") && (
                            <span className="ml-2 text-sm text-green-600 font-normal">
                              ✓ Đã chọn: {watch("productionRegion")}
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          {...register("productionRegion")}
                          className={`form-input ${errors.productionRegion ? "form-input-error" : ""
                            } ${watch("productionRegion")
                              ? "border-green-300 bg-green-50"
                              : ""
                            }`}
                          placeholder={
                            watch("productionCountry")
                              ? "Chọn từ bản đồ/danh sách bên trên hoặc nhập thủ công"
                              : "Nhập khu vực sản xuất"
                          }
                        />
                        {errors.productionRegion && (
                          <p className="form-error">
                            {errors.productionRegion.message}
                          </p>
                        )}
                        {!errors.productionRegion &&
                          watch("productionRegion") && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Khu vực đã được chọn từ{" "}
                              {watch("productionCountry")}
                            </p>
                          )}
                      </div>

                      {/* Manufacturing Process */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Quy Trình Sản Xuất{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("manufacturingProcess")}
                          className={`form-select ${errors.manufacturingProcess
                            ? "form-select-error"
                            : ""
                            } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                        >
                          <option value="">Chọn quy trình sản xuất</option>
                          <option value="Sản xuất cơ khí (Mechanical Recycling)">
                            Sản xuất cơ khí (Mechanical Recycling)
                          </option>
                          <option value="Tái chế hóa học (Chemical Recycling)">
                            Tái chế hóa học (Chemical Recycling)
                          </option>
                          <option value="Nhuộm sinh học (Bio-Dyeing)">
                            Nhuộm sinh học (Bio-Dyeing)
                          </option>
                          <option value="Sản xuất khép kín (Closed-loop Production)">
                            Sản xuất khép kín (Closed-loop Production)
                          </option>
                          <option value="Sử dụng nguyên liệu hữu cơ tái tạo (Organic & Renewable Materials)">
                            Sử dụng nguyên liệu hữu cơ tái tạo (Organic &
                            Renewable Materials)
                          </option>
                          <option value="custom">Khác (nhập thủ công)</option>
                        </select>
                        {errors.manufacturingProcess && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.manufacturingProcess.message}
                          </p>
                        )}

                        {watch("manufacturingProcess") === "custom" && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={customManufacturingProcess}
                              onChange={(e) => setCustomManufacturingProcess(e.target.value)}
                              className={`form-input ${errors.manufacturingProcess
                                ? "form-input-error"
                                : ""} rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                              placeholder="Nhập quy trình sản xuất tùy chỉnh"
                            />
                            <p className="text-xs text-gray-500 mt-1">Ví dụ: Khử trùng bằng plasma lạnh, Dệt 3D không phế thải...</p>
                          </div>
                        )}
                      </div>

                      {/* Transport Method Override */}
                      <div className="form-group">
                        <label className="form-label font-semibold text-gray-800">
                          Phương Thức Vận Chuyển
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            (bạn chọn - override)
                          </span>
                        </label>
                        <select
                          {...register("transportMethod")}
                          className={`form-select ${errors.transportMethod ? "form-select-error" : ""
                            } rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500`}
                          disabled={!watch("productionCountry")}
                        >
                          <option value="">
                            {watch("productionCountry")
                              ? `Mặc định (${transportTooltip?.method || "Đang tải..."
                              })`
                              : "Chọn quốc gia trước"}
                          </option>

                          {/* 4 standard transport methods from backend */}
                          <option value="Sea">
                            🚢 Sea - Vận chuyển bằng tàu biển (Ít carbon nhất)
                          </option>
                          <option value="Land">
                            🚚 Land - Vận chuyển bằng xe tải (Phù hợp cho khoảng
                            cách ngắn)
                          </option>
                          <option value="Rail">
                            🚂 Rail - Vận chuyển bằng tàu hỏa (Hiệu quả cao)
                          </option>
                          <option value="Air">
                            ✈️ Air - Vận chuyển bằng máy bay (Nhanh nhất nhưng
                            nhiều carbon)
                          </option>
                        </select>
                        {errors.transportMethod && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.transportMethod.message}
                          </p>
                        )}

                        {/* Transport method description */}
                        {watch("transportMethod") && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600">
                                {watch("transportMethod") === "Sea" && "🚢"}
                                {watch("transportMethod") === "Land" && "🚚"}
                                {watch("transportMethod") === "Rail" && "🚂"}
                                {watch("transportMethod") === "Air" && "✈️"}
                              </span>
                              <span className="font-medium text-green-800">
                                Đã chọn: {watch("transportMethod")}
                              </span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              {watch("transportMethod") === "Sea" &&
                                "Vận chuyển bằng tàu biển - Ít carbon nhất, thân thiện môi trường"}
                              {watch("transportMethod") === "Land" &&
                                "Vận chuyển bằng xe tải - Phù hợp cho khoảng cách ngắn, linh hoạt"}
                              {watch("transportMethod") === "Rail" &&
                                "Vận chuyển bằng tàu hỏa - Hiệu quả cao, tiết kiệm năng lượng"}
                              {watch("transportMethod") === "Air" &&
                                "Vận chuyển bằng máy bay - Nhanh nhất nhưng carbon footprint cao"}
                            </p>
                          </div>
                        )}

                        {/* Available methods from backend */}
                        {availableTransportMethods.length > 0 && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-xs font-medium text-blue-700 mb-2">
                              📊 Thông tin từ backend cho{" "}
                              {watch("productionCountry")}:
                            </h4>
                            <div className="space-y-1">
                              {availableTransportMethods.map(
                                (method, methodIndex) => (
                                  <div
                                    key={`method-info-${methodIndex}`}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span
                                      className={`${method.isRecommended
                                        ? "font-medium text-blue-700"
                                        : "text-blue-600"
                                        }`}
                                    >
                                      {method.isRecommended && "⭐ "}
                                      {method.method}
                                    </span>
                                    <span className="text-blue-500">
                                      {method.estimatedDistance} km
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                            <p className="text-xs text-blue-500 mt-2">
                              💡 Bạn có thể override bằng cách chọn phương thức
                              khác ở trên
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Sustainability Certificates */}
                      <div className="form-group md:col-span-2">
                        <label className="form-label font-semibold text-gray-800 mb-3">
                          Chứng Chỉ Bền Vững{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h5 className="text-sm font-semibold text-blue-800">Hướng dẫn mở khóa chứng chỉ</h5>
                          </div>
                          <div className="text-xs text-blue-800 space-y-1">
                            <p><strong>• CRADLE TO CRADLE:</strong> Cần Waste Diverted ≥ 75%</p>
                            <p><strong>• CARBONNEUTRAL:</strong> Cần Carbon Footprint ≤ 5 kgCO₂e/mét</p>
                            <p><strong>• GOTS:</strong> Cần chọn loại vật liệu có chứa từ "Organic"</p>
                            <p><strong>• OEKO-TEX:</strong> Cần cấp link document dẫn chứng để xác thực</p>
                          </div>
                          <div className="mt-2 text-xs text-blue-700">
                            💡 Chứng chỉ bị khóa sẽ hiển thị lý do cụ thể bên dưới mỗi mục
                          </div>
                        </div>

                        {/* Organic Material GOTS Certificate Info */}
                        {isOrganicMaterial && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-green-800">
                                  🌿 Vật liệu Organic được phát hiện
                                </h5>
                                <p className="text-xs text-green-700">
                                  {selectedMaterialType?.typeName}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white/60 p-3 rounded border border-green-100">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <p className="text-xs font-medium text-green-800">
                                  Chứng chỉ GOTS đã được kích hoạt tự động cho loại vật liệu này
                                </p>
                              </div>
                              <p className="text-xs text-green-600 mt-1 ml-4">
                                GOTS đánh giá tỷ lệ % sợi hữu cơ trong vật liệu
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Organic Material Certifications */}
                        {isOrganicMaterial && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white">🌿</span>
                              </div>
                              Chứng chỉ cho vật liệu Organic
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {getOrganicCertifications().map((certificationDetails) => (
                                <label
                                  key={certificationDetails}
                                  className="flex items-center space-x-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 cursor-pointer bg-green-25 transition-all shadow-sm hover:shadow-md"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCertifications.has(
                                      certificationDetails
                                    )}
                                    onChange={() =>
                                      handleCertificationToggle(
                                        certificationDetails
                                      )
                                    }
                                    className="rounded border-green-300 text-green-600 focus:ring-green-500 w-4 h-4"
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm font-semibold text-green-800">
                                      {certificationDetails}
                                    </span>
                                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Tự động kích hoạt cho vật liệu Organic
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Chứng chỉ dựa trên các chỉ số bền vững */}
                        <div className="mb-4">
                          <h4 className="text-3xl font-medium text-green-700 mb-2 flex items-center gap-2">
                            <svg className="w-6 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Các chứng chỉ bền vững có sẵn (vui lòng bỏ qua nếu không có)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {getAllCertifications()
                              .filter(cert => cert !== "GOTS") // GOTS sẽ được hiển thị riêng ở phần organic
                              .map((certificationDetails) => {
                                const isEnabled = isCertificationEnabled(certificationDetails);
                                const disabledReason = getDisabledReason(certificationDetails);

                                // Determine certificate type and styling
                                const getCertificateStyle = (cert: string, enabled: boolean) => {
                                  const baseStyle = enabled ? "cursor-pointer" : "cursor-not-allowed opacity-60";
                                  switch (cert) {
                                    case 'OEKO-TEX':
                                      return `${baseStyle} border-blue-200 ${enabled ? 'hover:bg-blue-50' : 'bg-gray-50'} text-blue-700`;
                                    case 'CRADLE TO CRADLE':
                                      return `${baseStyle} border-purple-200 ${enabled ? 'hover:bg-purple-50' : 'bg-gray-50'} text-purple-700`;
                                    case 'CARBONNEUTRAL':
                                      return `${baseStyle} border-red-200 ${enabled ? 'hover:bg-red-50' : 'bg-gray-50'} text-red-700`;
                                    default:
                                      return `${baseStyle} border-gray-200 ${enabled ? 'hover:bg-gray-50' : 'bg-gray-100'} text-gray-700`;
                                  }
                                };

                                return (
                                  <div
                                    key={certificationDetails}
                                    className={`relative group`}
                                  >
                                    <label
                                      className={`flex items-start space-x-3 p-4 border rounded-lg transition-all ${getCertificateStyle(certificationDetails, isEnabled)}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedCertifications.has(
                                          certificationDetails
                                        )}
                                        onChange={() =>
                                          isEnabled && handleCertificationToggle(
                                            certificationDetails
                                          )
                                        }
                                        disabled={!isEnabled}
                                        className={`mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">
                                            {certificationDetails}
                                          </span>
                                          {isEnabled ? (
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Có thể chọn"></span>
                                          ) : (
                                            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" title="Chưa đủ điều kiện"></span>
                                          )}
                                        </div>
                                        {!isEnabled && disabledReason && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            🔒 {disabledReason}
                                          </p>
                                        )}
                                        {isEnabled && !["OEKO-TEX"].includes(certificationDetails) && (
                                          <p className="text-xs text-green-600 mt-1">
                                            ✅ Đã đủ điều kiện để chọn
                                          </p>
                                        )}
                                        {isEnabled && ["OEKO-TEX"].includes(certificationDetails) && (
                                          <a href="https://www.oeko-tex.com/en/" className="text-xs text-blue-600 mt-1">
                                            📋 https://www.oeko-tex.com/en/
                                          </a>
                                        )}
                                      </div>
                                    </label>
                                  </div>
                                );
                              })}
                          </div>
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Hướng dẫn về các chỉ số và chứng chỉ
                            </h5>

                            <div className="space-y-3 text-xs text-blue-700">
                              {/* Carbon Footprint */}
                              <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                  <strong className="text-blue-900 text-base md:text-lg">Carbon Footprint (kgCO₂e/mét)</strong>
                                </div>
                                <p className="ml-4 mb-2 text-sm md:text-base text-gray-700">Lượng khí thải phát sinh để sản xuất 1 mét vật liệu.</p>
                                <p className="ml-4 text-blue-700 text-sm md:text-base">
                                  <strong>Ngưỡng đề xuất để sử dụng chứng chỉ này:</strong>
                                  <br />• ≤ 5 kgCO₂e/mét: mở khóa CarbonNeutral
                                  <br />• &gt; 5 kgCO₂e/mét: không hiển thị chứng chỉ liên quan
                                  <br />• <a href="https://www.carbonneutral.com/pdfs/The_CarbonNeutral_Protocol_Feb_2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
                                    https://www.carbonneutral.com/pdfs/The_CarbonNeutral_Protocol_Feb_2024.pdf
                                  </a>
                                  <br />• <a href="https://www.ifeu.de/fileadmin/uploads/ifeu_paper/IFEU_2022_-_Environmental_Footprints_of_Cotton_and_Cotton_Fibres_final.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
                                    https://www.ifeu.de/fileadmin/uploads/ifeu_paper/IFEU_2022_-_Environmental_Footprints_of_Cotton_and_Cotton_Fibres_final.pdf
                                  </a>
                                  <br />• <a href="https://www.co2everything.com/category/clothes-and-fabrics" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
                                    https://www.co2everything.com/category/clothes-and-fabrics
                                  </a>
                                </p>
                              </div>

                              {/* Waste Diverted */}
                              <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                  <strong className="text-blue-900 text-base md:text-lg">Waste Diverted (%)</strong>
                                </div>
                                <p className="ml-4 mb-2 text-sm md:text-base text-gray-700">
                                  Tỷ lệ chất thải (từ sản xuất hoặc sau sử dụng) không bị chôn lấp,
                                  mà được tái chế, tái sử dụng, hoặc thu hồi năng lượng.
                                </p>
                                <p className="ml-4 text-blue-700 text-sm md:text-base">
                                  <strong>Chứng chỉ sử dụng:</strong> Cradle to Cradle (mở khi ≥ 75%)
                                </p>
                                <a href="https://cdn.c2ccertified.org/resources/certification/standard/STD_C2C_Certified_V4.0_FINAL_031621.pdf" target="_blank" rel="noopener noreferrer" className="ml-4 text-blue-600 underline hover:text-blue-700 text-sm md:text-base">
                                  https://cdn.c2ccertified.org/resources/certification/standard/STD_C2C_Certified_V4.0_FINAL_031621.pdf</a><br />

                              </div>

                              {/* Specialized Certificates */}
                              <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                  <strong className="text-blue-900 text-base">Chứng chỉ chuyên biệt khác</strong>
                                </div>
                                <div className="ml-4 space-y-2 text-sm">
                                  <div className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">•</span>
                                    <div>
                                      <strong className="text-blue-900">OEKO-TEX:</strong>
                                      <span className="text-gray-700"> tập trung vào an toàn hóa chất và sức khỏe con người</span><br />
                                      <a href="https://www.hohenstein.vn/vi/oeko-tex" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
                                        https://www.hohenstein.vn/vi/oeko-tex
                                      </a>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">•</span>
                                    <div>
                                      <strong className="text-blue-900">GOTS:</strong>
                                      <span className="text-gray-700"> tập trung vào tỷ lệ % sợi hữu cơ (Organic Fiber)</span><br />
                                      <a href="https://vnce.vn/chung-nhan-gots-la-gi" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
                                        https://vnce.vn/chung-nhan-gots-la-gi
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Selected certificates display with binary score */}
                        {selectedCertifications.size > 0 && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-green-800">
                                ✓ Đã chọn {selectedCertifications.size} chứng
                                chỉ:
                              </p>
                              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                                100/100 điểm
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(selectedCertifications).map(
                                (certificationDetails) => {
                                  return (
                                    <span
                                      key={`cert-${certificationDetails}`}
                                      className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                      title="Sustainability certification"
                                    >
                                      {certificationDetails}
                                    </span>
                                  );
                                }
                              )}
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                              💡 Có chứng chỉ = 100 điểm | Không có chứng chỉ =
                              0 điểm | Không có chứng chỉ = 100 điểm (nếu
                              benchmarks yêu cầu)
                            </p>
                          </div>
                        )}

                        {/* Document URL inputs for selected certificates */}
                        {selectedCertifications.size > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-800 mb-3">
                              📎 Cung cấp đường dẫn chứng chỉ (bắt buộc)
                            </h4>
                            <div className="space-y-3">
                              {Array.from(selectedCertifications).map(
                                (certification) => (
                                  <div
                                    key={`url-input-${certification}`}
                                    className="flex flex-col"
                                  >
                                    <label className="text-xs font-medium text-blue-700 mb-1">
                                      {certification}
                                    </label>
                                    <input
                                      type="url"
                                      placeholder={`Nhập URL chứng chỉ ${certification}`}
                                      value={
                                        certificateDocumentUrls[
                                        certification
                                        ] || ""
                                      }
                                      onChange={(e) => {
                                        setCertificateDocumentUrls((prev) => ({
                                          ...prev,
                                          [certification]: e.target.value,
                                        }));
                                      }}
                                      className="form-input text-xs rounded border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                      required
                                    />
                                  </div>
                                )
                              )}
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                              💡 Vui lòng cung cấp URL hợp lệ cho từng chứng chỉ
                              đã chọn
                            </p>
                          </div>
                        )}

                        {errors.sustainabilityCriteria && (
                          <p className="form-error text-xs text-red-500 mt-1">
                            {errors.sustainabilityCriteria.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="dashboard-card mb-8 rounded-xl shadow-md border border-gray-200 bg-white dark:bg-gray-900">
                  <div className="card-header px-6 pt-6 pb-2">
                    <h3 className="card-title text-lg font-bold text-brand-700">
                      Hình Ảnh
                    </h3>
                    <p className="card-subtitle text-sm text-gray-500">
                      Tải lên hình ảnh vật liệu
                    </p>
                  </div>
                  <div className="card-body px-6 pb-6 pt-2">
                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-500 transition-colors">
                      <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        Tải Lên Hình Ảnh
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Kéo thả hình ảnh vào đây hoặc nhấp để duyệt
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={uploadedFiles.length >= 3}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`btn-secondary cursor-pointer inline-flex items-center gap-2 ${uploadedFiles.length >= 3
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                          }`}
                        onClick={(e) => {
                          if (uploadedFiles.length >= 3) {
                            e.preventDefault();
                            addToast("Đã đạt giới hạn 3 ảnh.", "info");
                          }
                        }}
                      >
                        <PlusIcon className="w-4 h-4" />
                        {uploadedFiles.length >= 3
                          ? "Đã đạt tối đa (3 ảnh)"
                          : "Chọn Hình Ảnh"}
                      </label>
                    </div>

                    {/* Uploaded Images Preview Grid */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">
                            Xem trước hình ảnh
                          </h5>
                          <span className="text-sm text-gray-600">
                            {uploadedFiles.length}/3 ảnh
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {imagePreviews.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`preview-${index}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 border border-red-200 rounded-full p-1 shadow transition"
                                aria-label="Xoá ảnh"
                              >
                                <CancelIcon className="w-4 h-4" />
                              </button>
                              {uploadedFiles[index]?.size !== undefined && (
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                                  {(
                                    uploadedFiles[index]!.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Số lượng đề xuất nhập kho lần đầu */}

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="btn-secondary"
                  >
                    <CancelIcon className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isLocked ||
                      isSubmitting ||
                      createMaterialMutation.isPending ||
                      uploadImagesMutation.isPending
                    }
                    className={`btn-primary font-bold rounded-lg px-6 py-2 text-base ${isLocked ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    {isLocked ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Đã Khóa ({formatCountdown(countdown)})
                      </>
                    ) : isSubmitting ||
                      createMaterialMutation.isPending ||
                      uploadImagesMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {isSubmitting
                          ? "Đang xử lý..."
                          : createMaterialMutation.isPending
                            ? "Đang tạo vật liệu..."
                            : "Đang tải lên hình ảnh..."}
                      </>
                    ) : (
                      <>
                        <SaveIcon className="w-4 h-4" />
                        Lưu Vật Liệu
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

export default AddMaterial;



