"use client";
import {ContentLayout} from "@/components/admin-panel/content-layout";
import {useSidebar} from "@/hooks/use-sidebar";
import {useStore} from "@/hooks/use-store";
import DataTable from "@/components/helpers/Table";
import type {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {ArrowUpDown, Trash2} from "lucide-react";
import * as React from "react";
import {useNotification} from "@/components/helpers/NotificationProvider";
import {ButtonLoading} from "@/components/helpers/ButtonLoading";
import BikeDialogContent from "@/app/dwh/warehouse/content-dialog";
import {BikesService, BikeWithModelName, RoleManagementWithName} from "@/models/api";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {useTranslation} from "react-i18next";
import FilterManager from "@/utils/filtermanager";
import {isRoleUserForProject} from "@/utils/helpers";

export default function WareHousePage() {
    const {t} = useTranslation();
    const {addNotification} = useNotification();
    const filterManager = new FilterManager();
    const [data, setData] = React.useState<BikeWithModelName[]>([]);
    const [isLoadingData, setIsLoadingData] = React.useState(true);
    const [loadingDeleteId, setLoadingDeleteId] = React.useState<number | null>(null);
    const [isLoadingDeleteCascade, setIsLoadingDeleteCascade] = React.useState(false);
    const [showCascadeDialog, setShowCascadeDialog] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<number | null>(null);

    const fetchData = React.useCallback(async () => {
        setIsLoadingData(true);
        const filterString = await filterManager.getFilterStringWithProjectIds();
        BikesService.getBikes(filterString === "" ? undefined : filterString)
            .then((bikes: BikeWithModelName[]) => setData(bikes))
            .catch(err => addNotification(`Failed to load bikes${err?.message ? `: ${err.message}` : ""}`, "error"))
            .finally(() => setIsLoadingData(false));
    }, [addNotification]);

    const deleteBike = (id: number, cascade: boolean = false) => {
        if (cascade) {
            setIsLoadingDeleteCascade(true);
        } else {
            setLoadingDeleteId(id);
        }

        BikesService.deleteBike(id, cascade)
            .then(async () => {
                addNotification(`Bike with id ${id}${cascade ? " and related data" : ""} deleted successfully`, "success");
                await fetchData();
                if (cascade) setShowCascadeDialog(false);
            })
            .catch((err) => {
                if (err?.status === 409 && !cascade) {
                    setShowCascadeDialog(true);
                    setDeleteId(id);
                    return;
                }
                addNotification(`Failed to delete bike${err?.message ? `: ${err.message}` : ""}`, "error")
            })
            .finally(() => {
                if (cascade) {
                    setIsLoadingDeleteCascade(false);
                } else {
                    setLoadingDeleteId(null);
                }
            });
    };

    const handleDelete = (event: React.MouseEvent, id: number) => {
        event.stopPropagation();
        deleteBike(id);
    };

    const handleCascadeDelete = () => {
        if (deleteId !== null) {
            deleteBike(deleteId, true);
        }
    };

    const handleCancelDelete = () => {
        setShowCascadeDialog(false);
    };

    const columns: ColumnDef<BikeWithModelName>[] = [
        {
            accessorKey: "id",
            header: t("label.id"),
        },
        {
            accessorKey: "model_name",
            header: t("label.model_name"),
        },
        {
            accessorKey: "serial_number",
            header: ({column}) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("label.serial_number")} <ArrowUpDown className="ml-2 h-4 w-4"/>
                </Button>
            ),
        },
        {
            accessorKey: "production_date",
            header: t("label.production_date"),
            cell: ({row}) => {
                const date = new Date(row.getValue("production_date"))
                return date.toLocaleDateString()
            },
        },
        {
            accessorKey: "quantity",
            header: t("label.quantity"),
        },
        {
            accessorKey: "warehouse_location",
            header: t("menu.warehouse"),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({row}) => {
                const bike: BikeWithModelName = row.original

                return (
                    <ButtonLoading
                        onClick={(event) => handleDelete(event, bike.id!)}
                        isLoading={loadingDeleteId === bike.id}
                        className="text-black dark:text-white p-2 rounded"
                        variant="destructive"
                        disabled={isRoleUserForProject(bike.project_id)}
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
        <ContentLayout title={t("menu.warehouse")}>
            <DataTable
                title={t("menu.warehouse")}
                columns={columns}
                data={data}
                isLoading={isLoadingData}
                filterColumn={"serial_number"}
                onRefresh={async () => {
                    await fetchData()
                }}
                rowDialogContent={(rowData, onClose) => (
                    <BikeDialogContent
                        rowData={rowData}
                        onClose={onClose}
                        onRefresh={fetchData}
                    />
                )}
                addDialogContent={(onClose) => (
                    <BikeDialogContent
                        onClose={onClose}
                        onRefresh={fetchData}
                    />
                )}
            />
            {showCascadeDialog && (
                <Dialog open={showCascadeDialog} onOpenChange={() => setShowCascadeDialog(false)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-center">
                                {t("delete_references.info")}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid">
                            <div className="flex justify-center space-x-4">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelDelete}
                                    className="w-[40%]"
                                >
                                    {t("button.cancel")}
                                </Button>
                                <ButtonLoading
                                    isLoading={isLoadingDeleteCascade}
                                    onClick={handleCascadeDelete}
                                    className="w-[40%]"
                                    variant="destructive"
                                >
                                    {t("delete_references.button")}
                                </ButtonLoading>
                            </div>
                        </div>
                    </DialogContent>

                </Dialog>
            )}
        </ContentLayout>
    );
}
