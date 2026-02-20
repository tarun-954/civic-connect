import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DepartmentService } from '../services/api';

type Official = {
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  designation?: string;
  imageUrl?: string;
};

type DepartmentGroup = {
  key: string;
  name: string;
  officials: Official[];
  supervisorCount: number;
  workerCount: number;
  totalOfficials: number;
};

export default function DepartmentsScreen({ navigation }: any) {
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await DepartmentService.getOfficials();
        if (response?.status === 'success') {
          const officials: Official[] = response.data?.officials || [];

          const byDept: Record<string, Official[]> = {};
          officials.forEach((official) => {
            const deptName = official.department || 'General Services';
            if (!byDept[deptName]) {
              byDept[deptName] = [];
            }
            byDept[deptName].push(official);
          });

          const groups: DepartmentGroup[] = Object.entries(byDept).map(([name, list]) => {
            const supervisorCount = list.filter(
              (o) => o.role === 'supervisor' || o.designation?.toLowerCase().includes('head')
            ).length;
            const workerCount = list.filter((o) => o.role === 'worker').length;
            return {
              key: name,
              name,
              officials: list,
              supervisorCount,
              workerCount,
              totalOfficials: list.length,
            };
          });

          // Sort alphabetically for a clean list
          groups.sort((a, b) => a.name.localeCompare(b.name));
          setDepartments(groups);
        } else {
          setError(response?.message || 'Failed to load departments');
          setDepartments([]);
        }
      } catch (e: any) {
        console.error('Error loading departments:', e);
        setError(e?.message || 'Failed to load departments');
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const totalDepartments = departments.length;
  const totalOfficials = useMemo(
    () => departments.reduce((sum, d) => sum + d.totalOfficials, 0),
    [departments]
  );

  const renderDepartmentCard = ({ item }: { item: DepartmentGroup }) => {
    const lead = item.officials[0];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Feather name="shield" size={20} color="#059669" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.totalOfficials} official{item.totalOfficials !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {lead && (
          <View style={styles.leadRow}>
            <View style={styles.leadAvatar}>
              {lead.imageUrl ? (
                <Image source={{ uri: lead.imageUrl }} style={styles.leadImage} />
              ) : (
                <Feather name="user" size={18} color="#6B7280" />
              )}
            </View>
            <View style={styles.leadInfo}>
              <Text style={styles.leadName} numberOfLines={1}>
                {lead.name}
              </Text>
              <Text style={styles.leadRole} numberOfLines={1}>
                {lead.designation || lead.role || 'Contact person'}
              </Text>
              {lead.phone && (
                <View style={styles.leadMetaRow}>
                  <Feather name="phone" size={12} color="#6B7280" />
                  <Text style={styles.leadMetaText} numberOfLines={1}>
                    {lead.phone}
                  </Text>
                </View>
              )}
              {lead.email && (
                <View style={styles.leadMetaRow}>
                  <Feather name="mail" size={12} color="#6B7280" />
                  <Text style={styles.leadMetaText} numberOfLines={1}>
                    {lead.email}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Feather name="users" size={12} color="#1F2937" />
            <Text style={styles.statText}>{item.totalOfficials} staff</Text>
          </View>
          {item.supervisorCount > 0 && (
            <View style={[styles.statPill, styles.supervisorPill]}>
              <Feather name="star" size={12} color="#F59E0B" />
              <Text style={styles.statText}>
                {item.supervisorCount} lead{item.supervisorCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {item.workerCount > 0 && (
            <View style={[styles.statPill, styles.workerPill]}>
              <Feather name="tool" size={12} color="#2563EB" />
              <Text style={styles.statText}>
                {item.workerCount} worker{item.workerCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#159D7E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Departments</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>City Departments</Text>
        <Text style={styles.summarySubtitle}>
          {totalDepartments > 0
            ? `${totalDepartments} departments • ${totalOfficials} officials`
            : 'Browse departments and contacts'}
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#159D7E" />
          <Text style={styles.loadingText}>Loading departments…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && departments.length === 0 && (
        <View style={styles.emptyContainer}>
          <Feather name="archive" size={40} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No departments found</Text>
          <Text style={styles.emptySubtitle}>
            Departments will appear here once officials are added.
          </Text>
        </View>
      )}

      {!loading && !error && departments.length > 0 && (
        <FlatList
          data={departments}
          keyExtractor={(item) => item.key}
          renderItem={renderDepartmentCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summarySubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#991B1B',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  leadImage: {
    width: '100%',
    height: '100%',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  leadRole: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  leadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  leadMetaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  supervisorPill: {
    backgroundColor: '#FFFBEB',
  },
  workerPill: {
    backgroundColor: '#EFF6FF',
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#111827',
  },
});
