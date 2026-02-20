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
  Alert,
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

type DepartmentInfo = {
  name: string;
  code?: string;
  location?: string;
  foundedDate?: string | Date;
  leaderName?: string;
  leaderEmail?: string;
  leaderPhone?: string;
};

type DepartmentGroup = {
  key: string;
  name: string;
  officials: Official[];
  supervisorCount: number;
  workerCount: number;
  totalOfficials: number;
  info?: DepartmentInfo;
};

const DEPARTMENT_DEFINITIONS = [
  {
    name: 'Road',
    image: require('../images/icons8-construction-50.png'),
  },
  {
    name: 'Electricity',
    image: require('../images/icons8-transmission-tower-24.png'),
  },
  {
    name: 'Sewage',
    image: require('../images/icons8-water-waste-96.png'),
  },
  {
    name: 'Cleanliness',
    image: require('../images/icons8-cleaning-50.png'),
  },
  {
    name: 'Dustbin Full',
    image: require('../images/icons8-garbage-truck-50.png'),
  },
  {
    name: 'Water',
    image: require('../images/icons8-water-49.png'),
  },
  {
    name: 'Streetlight',
    image: require('../images/icons8-street-light-64.png'),
  },
] as const;

const getDepartmentIcon = (name: string) => {
  const lower = name.toLowerCase();

  if (lower.includes('road') || lower.includes('transport')) {
    return { icon: 'truck', color: '#2563EB' };
  }
  if (lower.includes('water') || lower.includes('sewage') || lower.includes('drain')) {
    return { icon: 'droplet', color: '#0EA5E9' };
  }
  if (lower.includes('power') || lower.includes('electric') || lower.includes('energy')) {
    return { icon: 'zap', color: '#FACC15' };
  }
  if (lower.includes('health') || lower.includes('hospital')) {
    return { icon: 'heart', color: '#EF4444' };
  }
  if (lower.includes('sanitation') || lower.includes('clean') || lower.includes('waste')) {
    return { icon: 'trash-2', color: '#10B981' };
  }
  if (lower.includes('police') || lower.includes('security')) {
    return { icon: 'shield', color: '#4B5563' };
  }

  return { icon: 'grid', color: '#6366F1' };
};

const getDepartmentImage = (name: string) => {
  const def = DEPARTMENT_DEFINITIONS.find((d) => d.name === name);
  return def?.image;
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
        // Fetch both officials and department details in parallel
        const [officialsResponse, departmentsResponse] = await Promise.all([
          DepartmentService.getOfficials(),
          DepartmentService.getDepartments().catch((err) => {
            // Silently handle if department details endpoint is not available
            // This allows the screen to work even if the backend hasn't been updated yet
            console.log('Department details endpoint not available, continuing without details');
            return { status: 'success', data: { departments: [] } };
          })
        ]);

        if (officialsResponse?.status === 'success') {
          const officials: Official[] = officialsResponse.data?.officials || [];
          const deptDetails: DepartmentInfo[] = departmentsResponse?.data?.departments || [];

          const byDept: Record<string, Official[]> = {};
          officials.forEach((official) => {
            const deptName = official.department || 'General Services';
            // Only keep departments that are defined in the Report Issue screen
            if (!DEPARTMENT_DEFINITIONS.some((d) => d.name === deptName)) {
              return;
            }
            if (!byDept[deptName]) {
              byDept[deptName] = [];
            }
            byDept[deptName].push(official);
          });

          // Create a map of department details by name
          const deptInfoMap: Record<string, DepartmentInfo> = {};
          deptDetails.forEach((dept) => {
            deptInfoMap[dept.name] = dept;
          });

          // Build groups in the same order as the Report Issue categories,
          // using only those departments and attaching officials where present.
          const groups: DepartmentGroup[] = DEPARTMENT_DEFINITIONS.map((def) => {
            const list = byDept[def.name] || [];
            const supervisorCount = list.filter(
              (o) => o.role === 'supervisor' || o.designation?.toLowerCase().includes('head')
            ).length;
            const workerCount = list.filter((o) => o.role === 'worker').length;
            return {
              key: def.name,
              name: def.name,
              officials: list,
              supervisorCount,
              workerCount,
              totalOfficials: list.length,
              info: deptInfoMap[def.name],
            };
          });

          setDepartments(groups);
        } else {
          setError(officialsResponse?.message || 'Failed to load departments');
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

  const handleViewInfo = (dept: DepartmentGroup) => {
    const lines: string[] = [];

    // Department leader info
    if (dept.info?.leaderName) {
      lines.push(`👤 Head: ${dept.info.leaderName}`);
      if (dept.info.leaderPhone) {
        lines.push(`📞 Phone: ${dept.info.leaderPhone}`);
      }
      if (dept.info.leaderEmail) {
        lines.push(`📧 Email: ${dept.info.leaderEmail}`);
      }
      lines.push('');
    }

    // Location
    if (dept.info?.location) {
      lines.push(`📍 Location:`);
      lines.push(dept.info.location);
      lines.push('');
    }

    // Founded date / age
    if (dept.info?.foundedDate) {
      const founded = new Date(dept.info.foundedDate);
      const now = new Date();
      const yearsOld = Math.floor((now.getTime() - founded.getTime()) / (1000 * 60 * 60 * 24 * 365));
      lines.push(`📅 Established: ${founded.getFullYear()} (${yearsOld} years ago)`);
      lines.push('');
    }

    // Staff info
    lines.push(`👥 Total Staff: ${dept.totalOfficials}`);
    if (dept.supervisorCount > 0) {
      lines.push(`   • Supervisors: ${dept.supervisorCount}`);
    }
    if (dept.workerCount > 0) {
      lines.push(`   • Field Workers: ${dept.workerCount}`);
    }

    Alert.alert(dept.name, lines.join('\n'));
  };

  const handleViewUsers = (dept: DepartmentGroup) => {
    if (dept.officials.length === 0) {
      Alert.alert('No users found', 'No officials are registered for this department yet.');
      return;
    }

    const preview = dept.officials.slice(0, 5);
    const more = dept.officials.length - preview.length;

    const lines: string[] = preview.map((o) => {
      const role = o.designation || o.role || 'Official';
      return `• ${o.name} (${role})`;
    });

    if (more > 0) {
      lines.push(`…and ${more} more user${more > 1 ? 's' : ''}.`);
    }

    Alert.alert(`${dept.name} – users`, lines.join('\n'));
  };

  const renderDepartmentCard = ({ item }: { item: DepartmentGroup }) => {
    const depIcon = getDepartmentIcon(item.name);
    const depImage = getDepartmentImage(item.name);

    return (
      <View style={styles.gridItem}>
        <View style={[styles.logoCircle, { backgroundColor: `${depIcon.color}15` }]}>
          {depImage ? (
            <Image source={depImage} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Feather name={depIcon.icon as any} size={30} color={depIcon.color} />
          )}
        </View>

        <Text style={styles.gridDeptName} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.gridDeptMeta}>
          {item.totalOfficials} user{item.totalOfficials !== 1 ? 's' : ''}
        </Text>

        <View style={styles.gridButtonsRow}>
          <TouchableOpacity
            style={styles.gridButtonOutline}
            activeOpacity={0.8}
            onPress={() => handleViewInfo(item)}
          >
            <Text style={styles.gridButtonOutlineText}>Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridButtonPrimary}
            activeOpacity={0.85}
            onPress={() => handleViewUsers(item)}
          >
            <Text style={styles.gridButtonPrimaryText}>Users</Text>
          </TouchableOpacity>
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

        {totalDepartments > 0 && (
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTitleRow}>
                <Feather
                  name="grid"
                  size={14}
                  color="#4B5563"
                  style={styles.summaryCardIcon}
                />
                <Text style={styles.summaryCardTitle}>Departments</Text>
              </View>
              <Text style={styles.summaryCardValue}>{totalDepartments}</Text>
              <Text style={styles.summaryCardLabel}>Public service units</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTitleRow}>
                <Feather
                  name="users"
                  size={14}
                  color="#4B5563"
                  style={styles.summaryCardIcon}
                />
                <Text style={styles.summaryCardTitle}>Officials</Text>
              </View>
              <Text style={styles.summaryCardValue}>{totalOfficials}</Text>
              <Text style={styles.summaryCardLabel}>Staff across departments</Text>
            </View>
          </View>
        )}
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
          key="dept-grid-2"
          data={departments}
          keyExtractor={(item) => item.key}
          renderItem={renderDepartmentCard}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
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
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  summaryCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryCardIcon: {
    marginRight: 6,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryCardLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#9CA3AF',
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
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 34,
    height: 34,
  },
  gridDeptName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  gridDeptMeta: {
    marginTop: 4,
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  gridButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
    gap: 4,
  },
  gridButtonOutline: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  gridButtonOutlineText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4B5563',
  },
  gridButtonPrimary: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#159D7E',
  },
  gridButtonPrimaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
