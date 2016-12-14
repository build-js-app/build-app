//TODO use some Model interfaces
interface DbModels {
    ChemicalGroup: any,
    Chemical: any,
    Criterion: any,
    CriterionDetails: any,
    CriterionGroup: any,
    Calculation: any,
    ApplicationParameter: any,
    Log: any,
    Issue: any,
    IssueType: any
}

interface Log {
    id: number,
    category: string,
    message: string,
    date: Date,
    data: string
}

interface Issue {
    id: number,
    project: string,
    reportedDate: Date,
    reportedBy: string,
    isFixed: boolean,
    fixedDate: Date,
    assignedTo: string,
    wasApproved: boolean,
    approvedDate: Date,
    approvedBy: string,
    data: string
}

interface IssueType {
    id: number,
    project: string,
    abbreviation: string,
    name: string,
    description: string
}

interface ChemicalGroup {
    id: number,
    abbreviation: string,
    name: string,
    description?: string,
    sortOrder: number,
    chemicals?: Array<Chemical>
}

interface Chemical {
    id: number,
    code: string,
    name: string,
    description?: string,
    status: ChemicalStatus,
    sortOrder: number,
    chemicalGroupId: number,
    chemicalGroup?: ChemicalGroup,
    calculated: boolean,
    calculationFormula: string,
    calculationFormulaType: CalculationFormulaType,
    calculations?: Array<Calculation>
}

declare const enum ChemicalStatus {
    Approved,
    Pending
}

declare const enum CalculationFormulaType {
    Sum,
    NotDefined
}

interface Calculation {
    id: number,
    chemicalAlias: string,
    chemicalForCalculation?: Chemical
}

interface CriterionGroup {
    id: number,
    name: string,
    description?: string,
    criteria?: Array<Criterion>
}

interface Criterion {
    id: number,
    code: string,
    description?: string,
    sortOrder: number,
    criterionGroupId: number,
    criterionGroup?: CriterionGroup,
    //TODO use enums
    criterionType: string,
    category: string,
    color: string,
    textColor: string,
    data: string
}

declare const enum CriterionCategory {
    Health,
    Ecological,
    Both
}

declare enum CriterionType {
    Hil,
    Hsl,
    DirectContact,
    Eil,
    Esl,
    ManagementLimits
}

interface CriterionDetails {
    id: number,
    chemicalId: number,
    chemical?: Chemical,
    criterionId: number,
    criterion?: Criterion,
    description?: string,
    data: string
}

interface HilCriterionDetails {
    value: number
}

interface HslCriterionDetails {
    soilType: string,
    depthLevel: string
    value: number
}

interface EilCriterionDetails {
    ph?: number,
    cec?: number,
    clayContent?: number,
    value: number
}

interface EslCriterionDetails {
    soilTexture: string,
    value: number
}

interface MlCriterionDetails {
    soilTexture: string,
    value: number
}

interface DcCriterionDetails {
    selectedCriterionCode: string,
    value: number
}

declare const enum SoilTexture {
    Fine,
    Coarse,
    Null
}

declare const enum HslDepthLevel {
    Depth_0_to_1,
    Depth_1_to_2,
    Depth_2_to_4,
    Depth_4_to_unlimited
}

declare const enum HslSoilType {
    Sand,
    Silt,
    Clay
}
