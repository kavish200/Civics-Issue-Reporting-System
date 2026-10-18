import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import CategoryStep from './steps/CategoryStep';
import PhotoStep from './steps/PhotoStep';
import LocationStep from './steps/LocationStep';
import DetailsStep from './steps/DetailsStep';
import ReviewStep, { SuccessScreen } from './steps/ReviewStep';
import useReportStore from './reportStore';
import { colors, spacing } from '../../theme';

type ReportStep = 'category' | 'photo' | 'location' | 'details' | 'review' | 'success';

interface SuccessData {
  trackingId: string;
  duplicateCandidate: boolean;
  issueId: string;
}

export default function ReportFlowScreen() {
  const [currentStep, setCurrentStep] = useState<ReportStep>('category');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const { reset } = useReportStore();

  const handleNext = () => {
    const stepOrder: ReportStep[] = ['category', 'photo', 'location', 'details', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: ReportStep[] = ['category', 'photo', 'location', 'details', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      // First step, go back to previous screen
      router.back();
    }
  };

  const handleSubmitSuccess = (data: SuccessData) => {
    setSuccessData(data);
    setCurrentStep('success');
  };

  const handleNewReport = () => {
    reset();
    setSuccessData(null);
    setCurrentStep('category');
  };

  const handleViewIssue = (issueId: string) => {
    router.push(`/(citizen)/issues/${issueId}`);
  };

  return (
    <View style={styles.container}>
      {currentStep === 'category' && (
        <CategoryStep onNext={handleNext} />
      )}
      {currentStep === 'photo' && (
        <PhotoStep onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 'location' && (
        <LocationStep onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 'details' && (
        <DetailsStep onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 'review' && (
        <ReviewStep
          onBack={handleBack}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}
      {currentStep === 'success' && successData && (
        <SuccessScreen
          trackingId={successData.trackingId}
          duplicateCandidate={successData.duplicateCandidate}
          issueId={successData.issueId}
          onNewReport={handleNewReport}
          onViewIssue={handleViewIssue}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});