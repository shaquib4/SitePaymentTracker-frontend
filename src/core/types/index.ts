export type PaymentStatus = 'Pending' | 'InfoRequested' | 'Approved' | 'Rejected' | 'Completed';

export type UserRole = 'Admin' | 'Accountant' | 'Supervisor' | 'Vendor' | 'OfficeWorker';

export interface User {
  id: string;
  email?: string | null;
  fullName: string;
  phoneNumber: string;
  sixDigitUserId: string;
  role: UserRole;
  department: string;
  tenantId: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

export interface PaymentAuditLog {
  id: string;
  action: string;
  previousStatus: PaymentStatus | null;
  newStatus: PaymentStatus;
  performedByUserId: string;
  performedByUserName: string;
  timestampUtc: string;
  comments?: string;
}

export interface PaymentRequest {
  id: string;
  tenantId: string;
  userId: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  title: string;
  description?: string;
  requestedAmount?: number;
  approvedAmount?: number | null;
  amount: number;
  currency: string;
  category: string;
  categoryId?: string;
  siteId?: string;
  siteName?: string;
  labourerId?: string;
  labourerName?: string;
  expenseYear: number;
  startDate: string;
  endDate: string;
  status: PaymentStatus;
  statusName: string;
  invoiceNumber?: string;
  receiptAttachmentPath?: string;
  rejectionReason?: string;
  infoRequestDetails?: string;
  approvalComments?: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
  version: number;
  auditLogs: PaymentAuditLog[];
}

export interface CreatePaymentDto {
  title: string;
  description?: string;
  requestedAmount?: number;
  approvedAmount?: number | null;
  amount: number;
  currency?: string;
  category: string;
  categoryId?: string;
  siteId?: string;
  expenseYear: number;
  startDate: string;
  endDate: string;
  invoiceNumber?: string;
  receiptAttachmentPath?: string;
}

export interface WageRequestDto {
  labourerId: string;
  siteId: string;
  amount: number;
  expenseYear: number;
  startDate: string;
  endDate: string;
  title: string;
  description?: string;
}

export interface ApprovePaymentDto {
  version: number;
  comments?: string;
  approvedAmount?: number;
  updatedDescription?: string;
  overrideCategoryId?: string;
  newCategoryName?: string;
  overrideSiteId?: string;
}

export interface RequestInfoPaymentDto {
  version: number;
  questions: string;
}

export interface RejectPaymentDto {
  version: number;
  reason: string;
}

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
}

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  location?: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Labourer {
  id: string;
  tenantId?: string;
  supervisorId: string;
  supervisorName?: string;
  supervisorPhone?: string;
  supervisorSixDigitId?: string;
  siteId?: string;
  siteName?: string;
  name: string;
  photoUrl?: string;
  dailyWageRate: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdAtUtc: string;
  createdByUserId?: string;
  createdByUserName?: string;
  createdByUserRole?: string;
  totalWagesClaimed?: number;
  totalWagesApproved?: number;
  totalWageClaimsCount?: number;
  pendingWageClaimsCount?: number;
  approvedWageClaimsCount?: number;
  totalDaysWorked?: number;
}

export interface UpdateLabourerDto {
  name: string;
  dailyWageRate: number;
  siteId?: string | null;
  supervisorId?: string | null;
  photoUrl?: string;
  isActive?: boolean;
}

export type LabourerDto = Labourer;

export interface LabourerWagePayoutItem {
  paymentId: string;
  title: string;
  description?: string;
  siteId?: string;
  siteName?: string;
  startDate: string;
  endDate: string;
  claimDays: number;
  dailyWageRate: number;
  expectedWage: number;
  requestedAmount?: number;
  actualAmount: number;
  variance: number;
  hasDiscrepancy: boolean;
  status: PaymentStatus;
  requestDate: string;
  requestedBySupervisorName: string;
  requestedBySupervisorPhone: string;
  approvalDate?: string;
  approvedByUserName?: string;
  approvalComments?: string;
  rejectionReason?: string;
}

export interface LabourerWageAuditResponse {
  labourerId: string;
  name: string;
  dailyWageRate: number;
  photoUrl?: string;
  isActive: boolean;
  createdAtUtc: string;
  supervisorId: string;
  supervisorName: string;
  supervisorPhone: string;
  supervisorSixDigitId: string;
  createdByUserId?: string;
  createdByUserName: string;
  createdByUserRole: string;
  totalApprovedAmount: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  totalClaimedAmount: number;
  totalDaysClaimed: number;
  expectedTotalWages: number;
  totalVariance: number;
  exploitationRisk: string;
  exploitationRiskDescription: string;
  payouts: LabourerWagePayoutItem[];
}

export interface MeasurementBook {
  id: string;
  tenantId: string;
  siteId: string;
  month: number;
  year: number;
  excelFileUrl?: string;
  totalEstimatedValue: number;
  uploadedAt: string;
}

export interface SiteProfitabilityDto {
  siteId: string;
  siteName: string;
  location: string;
  finalPaymentReceived?: number;
  contractValue?: number;
  isSettled: boolean;
  settledAtUtc?: string;
  mbTotalEstimatedValue: number;
  hasMbUploaded: boolean;
  totalApprovedExpenses: number;
  totalPendingExpenses: number;
  currentMargin: number;
  profitMarginPercentage: number;
  settlementStatus: string;
  expenseClaimsCount: number;
  totalMbValue?: number;
  profitMargin?: number;
  marginPercentage?: number;
}

export interface SiteExpenseItemDto {
  id: string;
  title: string;
  description?: string;
  category: string;
  categoryId?: string;
  requestedAmount?: number;
  approvedAmount?: number | null;
  amount: number;
  status: PaymentStatus;
  startDate: string;
  endDate: string;
  createdAtUtc: string;
  userId: string;
  submitterName: string;
  submitterPhone: string;
  labourerId?: string;
  labourerName?: string;
  approvedAtUtc?: string;
  approvedByUserName?: string;
  approvalComments?: string;
  infoRequestDetails?: string;
  version?: number;
}

export interface PeriodAccessRequestDto {
  id: string;
  targetYear: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAtUtc: string;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedByUserEmail: string;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewedAtUtc?: string;
  adminNotes?: string;
}

export interface GenerateUserRequest {
  fullName: string;
  email?: string | null;
  phoneNumber: string;
  role: UserRole;
  department: string;
}

export interface GenerateUserResponse {
  userId?: string;
  id?: string;
  sixDigitUserId: string;
  temporaryPassword: string;
  email?: string | null;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  tenantId?: string;
}

export interface UserHistoryItem {
  id: string;
  title: string;
  description?: string;
  requestedAmount?: number;
  approvedAmount?: number | null;
  amount: number;
  category: string;
  siteId?: string;
  siteName?: string;
  labourerName?: string;
  status: PaymentStatus;
  startDate: string;
  endDate: string;
  requestDate: string;
  approvalDate?: string;
  approvalComments?: string;
  version: number;
}

export interface UserHistoryResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  sixDigitUserId: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  totalApprovedAmount: number;
  totalPendingAmount: number;
  totalRequestsCount: number;
  history: UserHistoryItem[];
  historicalRequests?: UserHistoryItem[];
  grandTotalAmount?: number;
  filteredCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  categoryBreakdowns?: CategoryBreakdown[];
}

export type UserHistoryDto = UserHistoryResponse;

export interface CategoryBreakdown {
  category: string;
  count: number;
  totalAmount: number;
}

export interface MonthlyExpense {
  month: number;
  monthName: string;
  totalAmount: number;
  count: number;
}

export interface FinanceMetricsDto {
  totalRequests: number;
  pendingApprovalCount: number;
  approvedCount: number;
  paidCount: number;
  rejectedCount: number;
  totalPendingAmount: number;
  totalApprovedAmount: number;
  totalPaidAmount: number;
  currency: string;
  categoryBreakdowns: CategoryBreakdown[];
  monthlyTrend: MonthlyExpense[];
}

export interface DashboardStatsDto {
  year: number;
  totalApprovedAmount: number;
  totalPendingAmount: number;
  totalCompletedAmount: number;
  totalRequestsCount: number;
  categoryBreakdown: { category: string; totalAmount: number; count: number }[];
  employeeBreakdown: { employeeName: string; employeeRole: string; totalAmount: number; count: number }[];
}

export interface PaymentFilterQuery {
  year: number;
  status?: PaymentStatus;
  category?: string;
  siteId?: string;
  requesterId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  onlyMine?: boolean;
  scope?: 'wage_requests' | 'material_requests' | 'my_wages';
}

export interface PaymentPagedSummary {
  grandTotalAmount: number;
  totalApprovedAmount: number;
  totalCompletedAmount: number;
  totalPendingAmount: number;
  totalInfoRequestedAmount: number;
  totalRejectedAmount: number;
  totalApprovedCount: number;
  totalCompletedCount: number;
  totalPendingCount: number;
  totalInfoRequestedCount: number;
  totalRejectedCount: number;
  categoryBreakdowns: CategoryBreakdown[];
}

export interface PagedPaymentsResponse {
  items: PaymentRequest[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  summary: PaymentPagedSummary;
}

export interface PagedSiteExpensesResponse {
  items: SiteExpenseItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  totalApprovedExpenses: number;
  totalPendingExpenses: number;
  grandTotalExpenses: number;
  distinctCategories: string[];
  categoryBreakdowns: CategoryBreakdown[];
}

export interface PagedUsersResponse {
  items: User[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface LabourerPagedSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  totalApprovedPayouts: number;
  totalClaimedPayouts: number;
}

export interface PagedLabourersResponse {
  items: LabourerDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  summary: LabourerPagedSummary;
}

export interface ExportJobStatusResponse {
  jobId: string;
  status: string;
  fileName?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface FinanceMetrics {
  totalRequests: number;
  pendingApprovalCount: number;
  totalApprovedAmount: number;
  totalPendingAmount: number;
  currency: string;
  year: number;
}

export interface AdminAuditPackRequest {
  year: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  siteId?: string;
  search?: string;
  recipientEmail?: string;
  reportTitle?: string;
}

export interface EmailConfigurationStatus {
  isConfigured: boolean;
  provider: 'Resend' | 'SMTP' | 'None' | string;
  fromAddress?: string;
  message: string;
}

export interface AuditReportJobItem {
  id: string;
  reportTitle: string;
  periodLabel: string;
  filterSummary: string;
  year: number;
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  categoryFilter?: string;
  siteId?: string;
  siteName?: string;
  searchFilter?: string;
  status: string | number;
  statusName: 'Queued' | 'Processing' | 'Completed' | 'Failed' | string;
  totalRecords: number;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  pdfFileName: string;
  excelFileName: string;
  hasPdf: boolean;
  hasExcel: boolean;
  pdfDownloadedAtUtc?: string;
  excelDownloadedAtUtc?: string;
  requestedByName: string;
  requestedByEmail: string;
  emailDispatched: boolean;
  emailDeliveryNote?: string;
  queuedAtUtc: string;
  completedAtUtc?: string;
  errorMessage?: string;
}
