import type { PaginatedResponse } from './pagination';

// ─── Enums ───────────────────────────────────────────────

export type IvaCondition =
  | 'responsable_inscripto'
  | 'monotributo'
  | 'exento'
  | 'no_responsable'
  | 'responsable_inscripto_iva';

export type InvoiceType =
  | 'factura_a'
  | 'factura_b'
  | 'factura_c'
  | 'factura_m'
  | 'nota_credito'
  | 'nota_debito';

export type InvoiceStatus = 'issued' | 'cancelled';

export type ProductType = 'product' | 'service';

export type DocumentType = 'cuit' | 'cuil' | 'dni' | 'pasaporte';

export type IvaRate = 0 | 10.5 | 21 | 27;

// ─── Auth ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  provider: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TenantOption {
  tenantId: string;
  name: string;
  slug: string;
}

export interface TenantSelectionResponse {
  requiresTenantSelection: true;
  tenants: TenantOption[];
}

export interface RegisterUserDto {
  tenantId: string;
  email: string;
  password: string;
  name?: string;
}

export interface LoginUserDto {
  tenantId?: string;
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// ─── Fiscal Address ──────────────────────────────────────

export interface FiscalAddress {
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  locality: string;
  province: string;
  postalCode: string;
}

export interface IibbInfo {
  registrationNumber: string;
  province: string;
  perceptionCondition?: string | null;
}

// ─── Legal Entity ────────────────────────────────────────

export interface LegalEntity {
  id: string;
  cuit: string;
  legalName: string;
  ivaCondition: IvaCondition;
  fiscalAddress: FiscalAddress;
  iibb: IibbInfo;
  activityCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLegalEntityDto {
  cuit: string;
  legalName: string;
  ivaCondition: IvaCondition;
  fiscalAddress: FiscalAddress;
  iibb: IibbInfo;
  activityCodes: string[];
  afipCert?: unknown;
  afipKey?: unknown;
}

export interface UpdateLegalEntityDto {
  cuit?: string;
  legalName?: string;
  ivaCondition?: IvaCondition;
  fiscalAddress?: FiscalAddress;
  iibb?: IibbInfo | null;
  activityCodes?: string[];
  afipCert?: unknown;
  afipKey?: unknown;
}

export type LegalEntityListResponse = PaginatedResponse<LegalEntity>;

// ─── Point of Sale ───────────────────────────────────────

export interface PointOfSale {
  id: string;
  legalEntityId: string;
  number: number;
  invoiceTypes: InvoiceType[];
  name: string;
  branch: string | null;
  priceListId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePointOfSaleDto {
  number: number;
  invoiceTypes: InvoiceType[];
  name: string;
  branch?: string | null;
  priceListId?: string | null;
}

export interface UpdatePointOfSaleDto {
  number?: number;
  invoiceTypes?: InvoiceType[];
  name?: string;
  branch?: string | null;
  priceListId?: string | null;
}

export type PointOfSaleListResponse = PaginatedResponse<PointOfSale>;

// ─── Customer ────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  ivaCondition: IvaCondition;
  address: FiscalAddress;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  ivaCondition: IvaCondition;
  address: FiscalAddress;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateCustomerDto {
  name?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  ivaCondition?: IvaCondition;
  address?: FiscalAddress;
  email?: string | null;
  phone?: string | null;
}

export type CustomerListResponse = PaginatedResponse<Customer>;

// ─── Product ─────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  code: string;
  type: ProductType;
  ivaRate: IvaRate;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  code: string;
  type?: ProductType;
  ivaRate: IvaRate;
  description?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  code?: string;
  type?: ProductType;
  ivaRate?: IvaRate;
  description?: string | null;
}

export type ProductListResponse = PaginatedResponse<Product>;

// ─── Price List ──────────────────────────────────────────

export interface PriceListItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  priceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceList {
  id: string;
  name: string;
  isActive: boolean;
  description: string | null;
  items: PriceListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceListSummary {
  id: string;
  name: string;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceListDto {
  name: string;
  description?: string | null;
}

export interface UpdatePriceListDto {
  name?: string;
  description?: string | null;
}

export interface UpsertPriceListItemDto {
  productId: string;
  priceCents: number;
}

export type PriceListListResponse = PaginatedResponse<PriceListSummary>;

// ─── Invoice ─────────────────────────────────────────────

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  ivaRate: IvaRate;
  productId?: string | null;
}

export interface InvoiceTributo {
  code: string;
  description: string;
  rate: number;
}

export interface IssueInvoiceDto {
  pointOfSaleId: string;
  items: InvoiceItem[];
  tributos?: InvoiceTributo[] | null;
  customerId?: string | null;
  emissionDate?: string | null;
}

export interface BuyerSnapshot {
  documentType: DocumentType | 'consumidor_final';
  documentNumber: string | null;
  name: string | null;
  ivaCondition: IvaCondition | null;
  address: FiscalAddress | null;
}

export interface InvoiceItemResponse {
  description: string;
  quantity: number;
  productId: string | null;
  unitPriceCents: number;
  ivaRate: IvaRate;
  amountCents: number;
}

export interface InvoiceTributoResponse {
  code: string;
  description: string;
  rate: number;
  amountCents: number;
}

export interface IvaBreakdownItem {
  rate: IvaRate;
  amountCents: number;
}

export interface Invoice {
  id: string;
  pointOfSaleId: string;
  customerId: string | null;
  receiptNumber: number;
  number: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  emissionDate: string;
  buyer: BuyerSnapshot;
  items: InvoiceItemResponse[];
  tributos: InvoiceTributoResponse[];
  subtotalCents: number;
  ivaAmountCents: number;
  ivaBreakdown: IvaBreakdownItem[] | null;
  tributosCents: number;
  totalCents: number;
  cae: string | null;
  caeVto: string | null;
  idempotencyKey: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  pointOfSaleId?: string;
  invoiceType?: InvoiceType;
  status?: InvoiceStatus;
  from?: string;
  to?: string;
  customerId?: string;
}

export type InvoiceListResponse = PaginatedResponse<Invoice>;

// ─── Pricing (Sync) ─────────────────────────────────────

export interface ImportedVariant {
  id: string;
  sourceVariantId: string;
  sku: string;
  price: number;
  promo: number;
  priceFormat: string;
  promoFormat: string | null;
  fileUrl: string | null;
  stock: number;
  options: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportedProduct {
  id: string;
  sourceProductId: string;
  title: string;
  sku: string;
  category: string;
  url: string;
  thumbnail: string | null;
  price: number;
  promo: number;
  priceFormat: string;
  promoFormat: string | null;
  stockAvailable: boolean;
  status: string | null;
  variants: ImportedVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface FailedSource {
  url: string;
  reason: string;
}

export interface SyncResult {
  importId: string;
  sourceUrl: string;
  status: string;
  totalProducts: number;
  totalVariants: number;
  failedSources: FailedSource[];
  startedAt: string;
  finishedAt: string;
}

export interface ImportedProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
}

export type ImportedProductListResponse = PaginatedResponse<ImportedProduct>;
