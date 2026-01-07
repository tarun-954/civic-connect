import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';
import { Fonts } from '../utils/fonts';

type ProofImage = {
  uri: string;
  filename?: string;
  uploadedAt?: string;
};

type QualityCheck = {
  status?: 'pass' | 'fail' | 'unknown';
  confidence?: number;
  summary?: string;
};

type RouteParams = {
  reportId?: string;
  trackingId?: string;
  photos?: ProofImage[];
  qualityCheck?: QualityCheck | null;
  canRespond?: boolean;
};

const ResolutionReviewScreen = ({ navigation, route }: any) => {
  const { reportId, trackingId, photos = [], qualityCheck, canRespond = false } =
    (route?.params as RouteParams) || {};
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reworkReason, setReworkReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      if (!reportId && !trackingId) {
        setLoading(false);
        return;
      }

      try {
        const response = reportId
          ? await ApiService.getReportById(reportId)
          : trackingId
            ? await ApiService.getReportByTrackingCode(trackingId)
            : null;

        const fetchedReport =
          response?.data?.report ||
          response?.data?.reports?.[0] ||
          response?.data ||
          null;

        if (isMounted) {
          setReport(fetchedReport);
          setError(null);
        }
      } catch (fetchError: any) {
        console.error('Error loading report details:', fetchError);
        if (isMounted) {
          setError(fetchError?.message || 'Failed to load report details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [reportId, trackingId]);

  const proofImages: ProofImage[] = useMemo(() => {
    if (photos && photos.length > 0) {
      return photos;
    }
    const resolutionPhotos = report?.resolution?.resolutionPhotos || [];
    return Array.isArray(resolutionPhotos) ? resolutionPhotos : [];
  }, [photos, report]);

  const aiReview: QualityCheck | null = useMemo(() => {
    if (qualityCheck) {
      return qualityCheck;
    }
    return report?.resolution?.qualityCheck || null;
  }, [qualityCheck, report]);

  const citizenCanRespond =
    canRespond && (report?.status === 'resolved' || !report);

  const handleApprove = async () => {
    if (!reportId) {
      return;
    }
    try {
      setSubmitting(true);
      await ApiService.approveResolution(reportId);
      Alert.alert('Thanks!', 'Your approval has been recorded.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (approveError: any) {
      console.error('Error approving resolution:', approveError);
      Alert.alert('Error', approveError?.message || 'Failed to approve the resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRejection = async () => {
    if (!reportId) {
      return;
    }
    const trimmedReason = reworkReason.trim();
    if (trimmedReason.length === 0) {
      Alert.alert('Add details', 'Please describe what still needs attention.');
      return;
    }

    try {
      setSubmitting(true);
      await ApiService.rejectResolution(reportId, trimmedReason);
      setReasonModalVisible(false);
      setReworkReason('');
      Alert.alert(
        'Feedback sent',
        'The department has been notified to continue working on this issue.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (rejectError: any) {
      console.error('Error rejecting resolution:', rejectError);
      Alert.alert('Error', rejectError?.message || 'Failed to request rework.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = useMemo(() => {
    const status = report?.status;
    switch (status) {
      case 'resolved':
        return { label: 'Awaiting Your Approval', color: '#3B82F6' };
      case 'closed':
        return { label: 'Closed', color: '#10B981' };
      default:
        return status
          ? { label: status.replace('_', ' ').toUpperCase(), color: '#6B7280' }
          : null;
    }
  }, [report?.status]);

  const confidencePercent =
    typeof aiReview?.confidence === 'number'
      ? Math.round(aiReview.confidence * 100)
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Work Proof</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Report Summary</Text>
            {statusBadge && (
              <View style={[styles.statusChip, { backgroundColor: `${statusBadge.color}15` }]}>
                <Feather name="info" size={14} color={statusBadge.color} />
                <Text style={[styles.statusChipText, { color: statusBadge.color }]}>
                  {statusBadge.label}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tracking ID</Text>
            <Text style={styles.summaryValue}>{trackingId || report?.trackingCode || 'N/A'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Category</Text>
            <Text style={styles.summaryValue}>
              {report?.issue?.category || 'Not specified'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Department</Text>
            <Text style={styles.summaryValue}>
              {report?.assignment?.department || 'Not assigned'}
            </Text>
          </View>
          {report?.resolution?.description && (
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Department Summary</Text>
              <Text style={styles.summaryDescription}>
                {report.resolution.description}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Proof Images</Text>
          {proofImages.length === 0 ? (
            <View style={styles.emptyProof}>
              <Feather name="image" size={24} color="#9CA3AF" />
              <Text style={styles.emptyProofText}>No proof images were provided.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
            >
              {proofImages.map((photo, index) => (
                <Image
                  key={`${photo.uri}-${index}`}
                  source={{ uri: photo.uri }}
                  style={styles.proofImage}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>AI Assessment</Text>
          <View
            style={[
              styles.aiSummary,
              aiReview?.status === 'pass'
                ? styles.aiPass
                : aiReview?.status === 'fail'
                  ? styles.aiFail
                  : styles.aiUnknown,
            ]}
          >
            <View style={styles.aiIconWrapper}>
              <Feather
                name={
                  aiReview?.status === 'fail'
                    ? 'x-octagon'
                    : aiReview?.status === 'pass'
                      ? 'check-circle'
                      : 'help-circle'
                }
                size={20}
                color={
                  aiReview?.status === 'fail'
                    ? '#B91C1C'
                    : aiReview?.status === 'pass'
                      ? '#047857'
                      : '#4B5563'
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiSummaryTitle}>
                {aiReview?.summary || 'Automated review not available.'}
              </Text>
              {confidencePercent !== null && (
                <Text style={styles.aiSummarySubtitle}>
                  Confidence: {confidencePercent}%
                </Text>
              )}
            </View>
          </View>
        </View>

        {error && (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                setReport(null);
                navigation.replace('ResolutionReview', {
                  reportId,
                  trackingId,
                  photos,
                  qualityCheck,
                  canRespond,
                });
              }}
            >
              <Feather name="refresh-cw" size={14} color="#1F2937" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#2563EB" />
            <Text style={styles.loadingText}>Loading report details...</Text>
          </View>
        )}

        {citizenCanRespond ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => setReasonModalVisible(true)}
              disabled={submitting}
            >
              <Feather name="alert-triangle" size={16} color="#B91C1C" />
              <Text style={[styles.actionButtonText, { color: '#B91C1C' }]}>
                Request Rework
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="thumbs-up" size={16} color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                    Approve
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, styles.infoCard]}>
            <Feather name="check-circle" size={18} color="#10B981" />
            <Text style={styles.infoCardText}>
              {report?.status === 'closed'
                ? 'This resolution has already been approved.'
                : 'No actions are required at this time.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={reasonModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!submitting) setReasonModalVisible(false);
        }}
      >
        <View style={styles.reasonBackdrop}>
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <Text style={styles.reasonTitle}>Request Rework</Text>
              <TouchableOpacity
                onPress={() => !submitting && setReasonModalVisible(false)}
                style={{ padding: 8 }}
              >
                <Feather name="x" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.reasonSubtitle}>
              Let the department know what still needs attention.
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Example: The pothole is still half-filled near the curb."
              placeholderTextColor="#9CA3AF"
              multiline
              value={reworkReason}
              onChangeText={setReworkReason}
            />
            <TouchableOpacity
              style={[
                styles.reasonSubmitButton,
                (submitting || reworkReason.trim().length === 0) && styles.submitDisabled,
              ]}
              onPress={submitRejection}
              disabled={submitting || reworkReason.trim().length === 0}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.reasonSubmitText}>Send Feedback</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Fonts.primary.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: Fonts.primary.bold,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  summaryBlock: {
    marginTop: 12,
  },
  summaryDescription: {
    marginTop: 6,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyProof: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  emptyProofText: {
    fontSize: 13,
    color: '#6B7280',
  },
  proofImage: {
    width: 180,
    height: 140,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  aiIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  aiSummarySubtitle: {
    fontSize: 13,
    color: '#4B5563',
  },
  aiPass: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  aiFail: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  aiUnknown: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  rejectButton: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  approveButton: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCardText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 14,
    color: '#4B5563',
  },
  errorCard: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
  },
  retryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  retryButtonText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  reasonBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reasonCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  reasonSubtitle: {
    fontSize: 14,
    color: '#4B5563',
  },
  reasonInput: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  reasonSubmitButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reasonSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  submitDisabled: {
    opacity: 0.6,
  },
});

export default ResolutionReviewScreen;


