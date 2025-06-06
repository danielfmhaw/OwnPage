import React from "react";
import {DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {BikesService, Fork, Frame, Saddle, WarehousePart, WareHousePartsService, WarehousePartWithName} from "@/models/api";
import InputField from "@/components/helpers/InputField";
import {ButtonLoading} from "@/components/helpers/ButtonLoading";
import {SelectLoading} from "@/components/helpers/SelectLoading";
import {useNotification} from "@/components/helpers/NotificationProvider";
import ProjectIDSelect from "@/components/helpers/selects/ProjectIDSelect";
import {useTranslation} from "react-i18next";
import FilterManager from "@/utils/filtermanager";
import {isRoleUserForProject} from "@/utils/helpers";

interface Props {
    rowData?: WarehousePartWithName;
    onClose: () => void;
    onRefresh: () => void;
}

export default function WarehousePartDialogContent({rowData, onClose, onRefresh}: Props) {
    const isEditMode = !!rowData;
    const {t} = useTranslation();
    const {addNotification} = useNotification();
    const filterManager = new FilterManager();
    const isDisabled = isRoleUserForProject(rowData?.project_id!)

    const [partId, setPartId] = React.useState<number | null>(null);
    const [projectId, setProjectId] = React.useState<string>("");
    const [partType, setPartType] = React.useState<string>("");
    const [quantity, setQuantity] = React.useState<number>(0);
    const [storageLocation, setStorageLocation] = React.useState<string>("");
    const [partIdOptions, setPartIdOptions] = React.useState<Frame[] | Fork[] | Saddle[]>([]);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [isLoadingParts, setIsLoadingParts] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (rowData) {
            setPartId(rowData.part_id ?? null);
            setProjectId(rowData.project_id?.toString() ?? "");
            setPartType(rowData.part_type ?? "");
            setQuantity(rowData.quantity ?? 0);
            setStorageLocation(rowData.storage_location ?? "");
        }
    }, [rowData]);

    React.useEffect(() => {
        if (!isEditMode && partType) {
            setIsLoadingParts(true)
            filterManager.addFilter("type", [`${partType}s`])
            BikesService.getBikeComponents(filterManager.getFilterString())
                .then(data => setPartIdOptions(data))
                .catch(err => addNotification(`Failed to load bike components${err?.message ? `: ${err.message}` : ""}`, "error"))
                .finally(() => setIsLoadingParts(false));
        }
    }, [partType]);

    const resetForm = () => {
        setProjectId("");
        setPartId(null);
        setPartType('');
        setQuantity(0);
        setStorageLocation('');
    };

    const handleSave = () => {
        const newData = {
            project_id: parseInt(projectId),
            part_type: partType,
            part_id: partId ?? 0,
            quantity,
            storage_location: storageLocation
        };
        setIsLoading(true)

        WareHousePartsService.createWareHousePart(newData)
            .then(() => {
                addNotification("Warehousepart saved successfully", "success");
                resetForm();
                onClose();
                onRefresh();
            })
            .catch(err => addNotification(`Failed to save warehousepart${err?.message ? `: ${err.message}` : ""}`, "error"))
            .finally(() => setIsLoading(false));
    };

    const handleUpdate = () => {
        const updatedData: WarehousePart = {
            id: rowData?.id || 0,
            part_type: partType,
            part_id: partId ?? 0,
            quantity,
            storage_location: storageLocation,
            project_id: parseInt(projectId) ?? 0,
        }
        setIsLoading(true)

        WareHousePartsService.updateWareHousePart(updatedData)
            .then(() => {
                addNotification("Warehousepart updated successfully", "success");
                onClose();
                onRefresh();
            })
            .catch(err => addNotification(`Failed to update warehousepart${err?.message ? `: ${err.message}` : ""}`, "error"))
            .finally(() => setIsLoading(false));
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isEditMode ? t("partsstorage.edit") : t("partsstorage.add")}</DialogTitle>
            </DialogHeader>
            {isEditMode ? (
                <>
                    <InputField label={t("label.project")} value={rowData.project_id}/>
                    <InputField label={t("label.part_type")} value={rowData.part_type}/>
                    <InputField label={t("label.part_name")} value={rowData?.part_name}/>
                </>
            ) : (
                <>
                    <ProjectIDSelect
                        projectID={projectId}
                        onChange={(value) => setProjectId(value)}
                    />
                    <div className="space-y-1">
                        <label className="block text-sm font-medium">Part Type</label>
                        <Select value={partType} onValueChange={setPartType}>
                            <SelectTrigger className="w-full p-2 border rounded">
                                <SelectValue placeholder={t("placeholder.part_type")}/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="frame">{t("bike_parts.frame")}</SelectItem>
                                <SelectItem value="fork">{t("bike_parts.fork")}</SelectItem>
                                <SelectItem value="saddle">{t("bike_parts.saddle")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium">{t("label.part_name")}</label>
                        <SelectLoading
                            id={partId}
                            setId={setPartId}
                            partIdOptions={partIdOptions}
                            isLoadingParts={isLoadingParts}
                            placeholderNoResults={t("placeholder.part_name")}
                        />
                    </div>
                </>
            )}

            <div className="space-y-2">
                <InputField label={t("label.quantity")} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}/>
                <InputField label={t("label.storage_location")}
                            value={storageLocation}
                            onChange={(e) => setStorageLocation(e.target.value)}
                            placeholder={t("placeholder.warehouse_position")}/>

            </div>

            <ButtonLoading
                isLoading={isLoading}
                onClick={isEditMode ? handleUpdate : handleSave}
                className="w-full mt-4"
                loadingText={t("placeholder.please_wait")}
                disabled={isEditMode && isDisabled}
            >
                {isEditMode ? t("button.update") : t("button.save")}
            </ButtonLoading>

        </DialogContent>
    );
}
