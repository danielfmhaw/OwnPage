"use client";
import {ContentLayout} from "@/components/admin-panel/content-layout";
import {useSidebar} from "@/hooks/use-sidebar";
import {useStore} from "@/hooks/use-store";
import DataTable from "@/components/helpers/Table";
import type {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {ArrowUpDown, Trash2} from "lucide-react";
import * as React from "react";
import WarehousePartDialogContent from "@/app/dwh/partsstorage/content-dialog";
import {WareHousePartsService, WarehousePartWithName} from "@/models/api";
import {ButtonLoading} from "@/components/helpers/ButtonLoading";
import {useNotification} from "@/components/helpers/NotificationProvider";
import {useTranslation} from "react-i18next";
import FilterManager from "@/utils/filtermanager";
import {isRoleUserForProject} from "@/utils/helpers";

export default function PartsStoragePage() {
    const {t} = useTranslation();
    const {addNotification} = useNotification();
    const filterManager = new FilterManager();
    const [data, setData] = React.useState<WarehousePartWithName[]>([]);
    const [isLoadingData, setIsLoadingData] = React.useState(true);
    const [loadingDeleteId, setLoadingDeleteId] = React.useState<number | null>(null);

    const fetchData = async () => {
        setIsLoadingData(true);
        const filterString = await filterManager.getFilterStringWithProjectIds();
        WareHousePartsService.getWareHouseParts(filterString === "" ? undefined : filterString)
            .then((warehouseparts: WarehousePartWithName[]) => {
                setData(warehouseparts);
            })
            .catch(err => addNotification(`Failed to load warehouseparts${err?.message ? `: ${err.message}` : ""}`, "error"))
            .finally(() => setIsLoadingData(false));
    };

    const handleDelete = (event: React.MouseEvent, id: number) => {
        event.stopPropagation();
        setLoadingDeleteId(id);
        WareHousePartsService.deleteWareHousePart(id)
            .then(async () => {
                addNotification(`Warehousepart with id ${id} successfully deleted`, "success");
                await fetchData();
            })
            .catch(err => addNotification(`Failed to delete warehousepart${err?.message ? `: ${err.message}` : ""}`, "error"))
            .finally(() => setLoadingDeleteId(null));
    };

    const columns: ColumnDef<WarehousePartWithName>[] = [
        {
            accessorKey: "id",
            header: t("label.id"),
        },
        {
            accessorKey: "part_type",
            header: ({column}) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("label.part_type")}<ArrowUpDown className="ml-2 h-4 w-4"/>
                </Button>
            ),
        },
        {
            accessorKey: "part_name",
            header: t("label.part_name"),
        },
        {
            accessorKey: "quantity",
            header: t("label.quantity"),
        },
        {
            accessorKey: "storage_location",
            header: t("label.warehouse_position"),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({row}) => {
                const warehousePart: WarehousePartWithName = row.original

                return (
                    <ButtonLoading
                        onClick={(event) => handleDelete(event, warehousePart.id!)}
                        isLoading={loadingDeleteId === warehousePart.id}
                        className="text-black dark:text-white p-2 rounded"
                        variant="destructive"
                        disabled={isRoleUserForProject(warehousePart.project_id)}
                    >
                        <Trash2 className="w-5 h-5"/>
                    </ButtonLoading>
                )
            },
        },
    ]

    const sidebar = useStore(useSidebar, (x) => x);
    if (!sidebar) return null;

    return (
        <ContentLayout title={t("menu.parts_storage")}>
            <DataTable
                title={t("menu.parts_storage")}
                columns={columns}
                data={data}
                isLoading={isLoadingData}
                filterColumn={"storage_location"}
                onRefresh={async () => {
                    await fetchData()
                }}
                rowDialogContent={(rowData, onClose) => (
                    <WarehousePartDialogContent
                        rowData={rowData}
                        onClose={onClose}
                        onRefresh={fetchData}
                    />
                )}
                addDialogContent={(onClose) => (
                    <WarehousePartDialogContent
                        onClose={onClose}
                        onRefresh={fetchData}
                    />
                )}
            />
        </ContentLayout>
    );
}
