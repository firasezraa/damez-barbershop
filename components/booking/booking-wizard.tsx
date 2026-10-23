"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { wizardSlideVariants } from "@/lib/motion";
import { BookingHeader } from "./booking-header";
import { BookingBottomBar } from "./booking-bottom-bar";
import { Button } from "@/components/ui/button";
import { Step1Services } from "./step-1-services";
import { Step2Barber } from "./step-2-barber";
import { Step3Schedule } from "./step-3-schedule";
import { Step4Contact } from "./step-4-contact";
import { Step5Summary } from "./step-5-summary";
import {
  BOOKING_SERVICES,
  BOOKING_BARBERS,
  ANY_BARBER_ID,
  FLAT_DOWN_PAYMENT_IDR,
} from "./constants";
import { BookingFormData, BookingStep, HoldBookingResponse } from "./types";
import { calculateBookingTotals, validateIndonesianPhone } from "./utils";

const STORAGE_KEY = "damez_booking_draft_v1";

interface BookingWizardProps {
  initialServiceId?: string;
  initialBarberId?: string;
  onBookingSuccess?: (bookingCode: string, bookingId: string) => void;
}

export function BookingWizard({
  initialServiceId,
  initialBarberId,
  onBookingSuccess,
}: BookingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Initial State Initialization (Tuple with Direction: [step, direction])
  const [stepTuple, setStepTuple] = React.useState<[BookingStep, number]>([1, 0]);
  const [currentStep, direction] = stepTuple;
  const setCurrentStep = React.useCallback((step: BookingStep | ((prev: BookingStep) => BookingStep)) => {
    setStepTuple((prev) => {
      const next = typeof step === "function" ? step(prev[0]) : step;
      const dir = next > prev[0] ? 1 : next < prev[0] ? -1 : 0;
      return [next, dir];
    });
  }, []);
  const [formData, setFormData] = React.useState<BookingFormData>(() => {
    // Check initial service from props or URL
    const queryService = searchParams?.get("service") || initialServiceId;
    const queryBarber = searchParams?.get("barber") || initialBarberId;

    let defaultServices = ["a0000001-0000-0000-0000-000000000001"]; // SRV-01 Gentlemen Classic Haircut
    if (queryService) {
      const match = BOOKING_SERVICES.find(
        (s) =>
          s.id.toLowerCase() === queryService.toLowerCase() ||
          s.code.toLowerCase() === queryService.toLowerCase()
      );
      if (match) {
        defaultServices = [match.id];
      }
    }

    let defaultBarber: string | null = null;
    if (queryBarber) {
      const matchBarber = BOOKING_BARBERS.find(
        (b) =>
          b.id.toLowerCase() === queryBarber.toLowerCase() ||
          b.code.toLowerCase() === queryBarber.toLowerCase()
      );
      if (matchBarber) {
        defaultBarber = matchBarber.id;
      }
    }

    return {
      selectedServiceIds: defaultServices,
      barberId: defaultBarber,
      selectedDate: "",
      selectedTime: "",
      customerName: "",
      customerPhone: "",
      notes: "",
      agreedToPDP: true,
    };
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [conflictError, setConflictError] = React.useState<string | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const isSubmittingRef = React.useRef(false);
  const lastSubmitTimeRef = React.useRef(0);

  // Restore draft from localStorage on client mount if available
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData((prev) => ({
            ...prev,
            customerName: parsed.customerName || prev.customerName,
            customerPhone: parsed.customerPhone || prev.customerPhone,
            notes: parsed.notes || prev.notes,
          }));
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  // Save contact draft changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          notes: formData.notes,
        })
      );
    } catch (e) {
      // Ignore
    }
  }, [formData.customerName, formData.customerPhone, formData.notes]);

  // Scroll to top on step transition
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // 2. Computed Calculation
  const calculation = React.useMemo(() => {
    return calculateBookingTotals(
      formData.selectedServiceIds,
      formData.selectedTime
    );
  }, [formData.selectedServiceIds, formData.selectedTime]);

  // 3. Validation Logic per Step
  const stepValidation = React.useMemo(() => {
    const isStep1Valid =
      formData.selectedServiceIds.length >= 1 &&
      formData.selectedServiceIds.length <= 2;

    const isStep2Valid = true; // Barber can be null (Any) or a specific ID

    const isStep3Valid =
      Boolean(formData.selectedDate) && Boolean(formData.selectedTime);

    const phoneCheck = validateIndonesianPhone(formData.customerPhone);
    const isStep4Valid =
      formData.customerName.trim().length >= 2 &&
      phoneCheck.isValid &&
      formData.agreedToPDP;

    const isStep5Valid = isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid;

    return {
      step1: isStep1Valid,
      step2: isStep2Valid,
      step3: isStep3Valid,
      step4: isStep4Valid,
      step5: isStep5Valid,
      phoneCheck,
    };
  }, [formData]);

  const canProceed = React.useMemo(() => {
    switch (currentStep) {
      case 1:
        return stepValidation.step1;
      case 2:
        return stepValidation.step2;
      case 3:
        return stepValidation.step3;
      case 4:
        return stepValidation.step4;
      case 5:
        return stepValidation.step5;
    }
  }, [currentStep, stepValidation]);

  const disabledReason = React.useMemo(() => {
    if (canProceed) return undefined;
    switch (currentStep) {
      case 1:
        return "Pilih minimal 1 layanan (maksimal 2)";
      case 2:
        return "Tentukan barber pilihan Anda";
      case 3:
        if (!formData.selectedDate) return "Pilih tanggal kedatangan";
        if (!formData.selectedTime) return "Pilih jam kursi yang tersedia";
        return "Tentukan tanggal dan jam";
      case 4:
        if (formData.customerName.trim().length < 2) return "Lengkapi nama lengkap";
        if (!stepValidation.phoneCheck.isValid) return "Nomor WA belum valid (08xx)";
        if (!formData.agreedToPDP) return "Centang persetujuan data pribadi";
        return "Lengkapi data diri Anda";
      case 5:
        return "Rincian belum lengkap";
    }
  }, [canProceed, currentStep, formData, stepValidation]);

  // 4. Step Navigation Handlers
  const handleNext = async () => {
    if (!canProceed) return;

    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as BookingStep);
      return;
    }

    // Step 5: Submit hold request to /api/booking/hold
    await handleLockAndHold();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as BookingStep);
    }
  };

  const handleStepClick = (targetStep: BookingStep) => {
    if (canNavigateToStep(targetStep)) {
      setCurrentStep(targetStep);
    }
  };

  const canNavigateToStep = (targetStep: BookingStep): boolean => {
    if (targetStep === currentStep) return true;
    if (targetStep === 1) return true;
    if (targetStep === 2) return stepValidation.step1;
    if (targetStep === 3) return stepValidation.step1 && stepValidation.step2;
    if (targetStep === 4) return stepValidation.step1 && stepValidation.step2 && stepValidation.step3;
    if (targetStep === 5) return stepValidation.step1 && stepValidation.step2 && stepValidation.step3 && stepValidation.step4;
    return false;
  };

  // 5. Submit Booking Hold (15-Minute Locking)
  const handleLockAndHold = async () => {
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSubmitTimeRef.current < 800) {
      return;
    }
    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;

    setIsLoading(true);
    setConflictError(null);
    setGeneralError(null);

    try {
      // Determine effective barber ID: if null or any, pick first active barber
      let targetBarberId = formData.barberId;
      if (!targetBarberId || targetBarberId === ANY_BARBER_ID) {
        targetBarberId = BOOKING_BARBERS[0].id;
      }

      const phoneValidation = validateIndonesianPhone(formData.customerPhone);
      const normalizedPhone = phoneValidation.isValid
        ? phoneValidation.normalized
        : formData.customerPhone;

      // Format ISO 8601 berzona Asia/Jakarta (+07:00) untuk pencegahan NaN Date
      const startIso = formData.selectedTime.includes("T")
        ? formData.selectedTime
        : `${formData.selectedDate}T${formData.selectedTime}:00+07:00`;
      const endIso = calculation.endTime.includes("T")
        ? calculation.endTime
        : `${formData.selectedDate}T${calculation.endTime}:00+07:00`;

      const payload = {
        barber_id: targetBarberId,
        booking_date: formData.selectedDate,
        start_time: startIso,
        end_time: endIso,
        service_duration_minutes: calculation.totalServiceMinutes,
        total_price_idr: calculation.totalPrice,
        down_payment_idr: FLAT_DOWN_PAYMENT_IDR,
        customer_name: formData.customerName.trim(),
        customer_phone: normalizedPhone,
        service_ids: formData.selectedServiceIds,
        notes: formData.notes.trim() || undefined,
      };

      const res = await fetch("/api/booking/hold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as HoldBookingResponse;

      if (res.status === 409 || data.error?.includes("SLOT_ALREADY_LOCKED") || data.error?.includes("sudah terisi")) {
        // Slot Conflict detected
        setConflictError(
          data.error ||
            `Slot pukul ${formData.selectedTime} baru saja dikunci oleh pelanggan lain beberapa detik yang lalu.`
        );
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunci slot reservasi.");
      }

      // Success: Slot held for 15 minutes!
      const bookingCode = data.data?.booking_code || "";
      const bookingId = data.data?.booking_id || "";

      if (onBookingSuccess) {
        onBookingSuccess(bookingCode, bookingId);
      } else {
        // Navigate to payment screen (handled by downstream task M4-04)
        router.push(`/booking/payment?code=${bookingCode}&id=${bookingId}`);
      }
    } catch (err: unknown) {
      const isNetworkErr =
        err instanceof TypeError &&
        (err.message.includes("fetch") ||
          err.message.includes("network") ||
          err.message.includes("Failed"));
      const msg = isNetworkErr
        ? "Koneksi internet terputus atau server belum merespons. Periksa jaringan Anda lalu tekan tombol Coba Lagi."
        : err instanceof Error
        ? err.message
        : String(err);
      setGeneralError(msg);
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  // 6. Updaters for form data
  const handleToggleService = (serviceId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedServiceIds.includes(serviceId);
      if (exists) {
        if (prev.selectedServiceIds.length === 1) return prev; // Keep at least 1
        return {
          ...prev,
          selectedServiceIds: prev.selectedServiceIds.filter((id) => id !== serviceId),
        };
      } else {
        if (prev.selectedServiceIds.length >= 2) return prev;
        return {
          ...prev,
          selectedServiceIds: [...prev.selectedServiceIds, serviceId],
        };
      }
    });
  };

  const handleSelectBarber = (barberId: string | null) => {
    setFormData((prev) => ({
      ...prev,
      barberId,
    }));
  };

  const handleSelectDate = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedDate: date,
      selectedTime: "", // Reset time on date change to prevent invalid selection
    }));
  };

  const handleSelectTime = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTime: time,
    }));
    setConflictError(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Wizard Header with Progress */}
      <BookingHeader
        currentStep={currentStep}
        onBack={handleBack}
        onStepClick={handleStepClick}
        canNavigateToStep={canNavigateToStep}
      />

      {/* Main Form Content Area */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 sm:px-6">
        {generalError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive flex items-center justify-between gap-3"
          >
            <div className="flex-1 leading-relaxed">{generalError}</div>
            {currentStep === 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleLockAndHold()}
                disabled={isLoading}
                className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                Coba Lagi
              </Button>
            )}
          </div>
        )}

        <div className="relative overflow-hidden w-full min-h-[480px]">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={wizardSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              {currentStep === 1 && (
                <Step1Services
                  selectedServiceIds={formData.selectedServiceIds}
                  onToggleService={handleToggleService}
                />
              )}

              {currentStep === 2 && (
                <Step2Barber
                  selectedBarberId={formData.barberId}
                  onSelectBarber={handleSelectBarber}
                  selectedDate={formData.selectedDate}
                />
              )}

              {currentStep === 3 && (
                <Step3Schedule
                  selectedDate={formData.selectedDate}
                  selectedTime={formData.selectedTime}
                  barberId={formData.barberId}
                  totalServiceDuration={calculation.totalServiceMinutes}
                  onSelectDate={handleSelectDate}
                  onSelectTime={handleSelectTime}
                />
              )}

              {currentStep === 4 && (
                <Step4Contact
                  customerName={formData.customerName}
                  customerPhone={formData.customerPhone}
                  notes={formData.notes}
                  agreedToPDP={formData.agreedToPDP}
                  onUpdateName={(name) =>
                    setFormData((prev) => ({ ...prev, customerName: name }))
                  }
                  onUpdatePhone={(phone) =>
                    setFormData((prev) => ({ ...prev, customerPhone: phone }))
                  }
                  onUpdateNotes={(notes) =>
                    setFormData((prev) => ({ ...prev, notes }))
                  }
                  onTogglePDP={(agreed) =>
                    setFormData((prev) => ({ ...prev, agreedToPDP: agreed }))
                  }
                />
              )}

              {currentStep === 5 && (
                <Step5Summary
                  formData={formData}
                  calculation={calculation}
                  onEditStep={(step) => setCurrentStep(step)}
                  conflictError={conflictError}
                  onDismissConflict={() => setConflictError(null)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Sticky Ergonomic Bottom Navigation Bar */}
      <BookingBottomBar
        currentStep={currentStep}
        totalPrice={calculation.totalPrice}
        totalMinutes={calculation.totalServiceMinutes}
        canProceed={canProceed}
        onNext={handleNext}
        isLoading={isLoading}
        disabledReason={disabledReason}
      />
    </div>
  );
}
