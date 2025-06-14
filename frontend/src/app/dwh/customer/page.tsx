"use client";
import {ContentLayout} from "@/components/admin-panel/content-layout";
import {useSidebar} from "@/hooks/use-sidebar";
import {useStore} from "@/hooks/use-store";
import DataTable from "@/components/helpers/Table";
import * as React from "react";
import {useNotification} from "@/components/helpers/NotificationProvider";
import {CustomColumnDef} from "@/models/datatable/column";
import {Button} from "@/components/ui/button";
import {Trash2} from "lucide-react";
import {ButtonLoading} from "@/components/helpers/ButtonLoading";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import CustomerDetailContent from "@/app/dwh/customer/customer-detail-content";
import AddCustomerContent from "@/app/dwh/customer/add-customer-content";
import {useTranslation} from "react-i18next";
import {Customer, CustomersService} from "@/models/api";
import {isRoleUserForProject} from "@/utils/helpers";
import {genericItemsLoader, ItemsLoaderOptions, useRefreshData} from "@/models/datatable/itemsLoader";
import {createCustomerFilterItemLoader} from "@/models/datatable/filterItemsLoader";
import {FilterDefinition} from "@/components/helpers/FilterBar";

export default function CustomerPage() {
    const {t} = useTranslation();
    const {addNotification} = useNotification();
    const refreshData = useRefreshData(itemsLoader);

    const [data, setData] = React.useState<Customer[]>([]);
    const [totalCount, setTotalCount] = React.useState<number>(0);
    const [loadingDeleteId, setLoadingDeleteId] = React.useState<number | null>(null);
    const [isLoadingDeleteCascade, setIsLoadingDeleteCascade] = React.useState(false);
    const [showCascadeDialog, setShowCascadeDialog] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<number | null>(null);
    const [itemsLoaderOptions, setItemsLoaderOptions] = React.useState<ItemsLoaderOptions | null>(null);

    async function itemsLoader(options: ItemsLoaderOptions): Promise<void> {
        setItemsLoaderOptions(options);
        return genericItemsLoader<Customer>(
            options,
            CustomersService.getCustomers,
            setData,
            setTotalCount
        );
    }

    const deleteCustomer = (id: number, cascade: boolean = false) => {
        if (cascade) {
            setIsLoadingDeleteCascade(true);
        } else {
            setLoadingDeleteId(id);
        }

        CustomersService.deleteCustomer(id, cascade)
            .then(async () => {
                addNotification(`Customer with id ${id}${cascade ? " and related data" : ""} deleted successfully`, "success");
                await refreshData();
                if (cascade) setShowCascadeDialog(false);
            })
            .catch((err) => {
                if (err?.status === 409 && !cascade) {
                    setShowCascadeDialog(true);
                    setDeleteId(id);
                    return;
                }
                addNotification(`Failed to delete customer: ${err?.message ?? err}`, "error");
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
        deleteCustomer(id);
    };

    const handleCascadeDelete = () => {
        if (deleteId !== null) {
            deleteCustomer(deleteId, true);
        }
    };

    const handleCancelDelete = () => {
        setShowCascadeDialog(false);
    };

    const columns: CustomColumnDef<Customer>[] = [
        {
            accessorKey: "first_name",
            header: t("label.first_name"),
            widthPercent: 15,
        },
        {
            accessorKey: "name",
            header: t("label.name"),
            widthPercent: 15,
        },
        {
            accessorKey: "email",
            header: t("label.email"),
            widthPercent: 30,
            mobileTitle: true,
        },
        {
            accessorKey: "dob",
            header: t("label.dob"),
            cell: ({row}) => {
                const date = new Date(row.getValue("dob"))
                return date.toLocaleDateString()
            },
            widthPercent: 20,
        },
        {
            accessorKey: "city",
            header: t("label.city"),
            widthPercent: 15,
        },
        {
            id: "actions",
            enableHiding: false,
            widthPercent: 5,
            cell: ({row}) => {
                const customer: Customer = row.original

                return (
                    <ButtonLoading
                        onClick={(event) => handleDelete(event, customer.id!)}
                        isLoading={loadingDeleteId === customer.id}
                        className="text-black dark:text-white p-2 rounded"
                        variant="destructive"
                        disabled={isRoleUserForProject(customer.project_id)}
                    >
                        <Trash2 className="w-5 h-5"/>
                    </ButtonLoading>
                )
            },
        },
    ]

    const filters: FilterDefinition[] = React.useMemo(() => {
        if (!itemsLoaderOptions) return [];
        const customerFilterLoader = createCustomerFilterItemLoader(itemsLoaderOptions);

        return [
            customerFilterLoader("first_name", {pinned: false, type: "search"}),
            customerFilterLoader("name", {pinned: false, type: "search"}),
            customerFilterLoader("email", {type: "search"}),
            customerFilterLoader("city"),
            customerFilterLoader("dob", {type: "date"}),
        ];
    }, [itemsLoaderOptions]);

    const sidebar = useStore(useSidebar, (x) => x);
    if (!sidebar) return null;

    return (
        <ContentLayout title={t("customer.data")}>
            <DataTable
                title={t("customer.data")}
                columns={columns}
                data={data}
                itemsLoader={itemsLoader}
                totalCount={totalCount}
                filterDefinition={filters}
                rowDialogContent={(rowData, onClose) => (
                    <CustomerDetailContent
                        rowData={rowData}
                        onClose={onClose}
                        onRefresh={refreshData}
                    />
                )}
                addDialogContent={(onClose) => (
                    <AddCustomerContent
                        onClose={onClose}
                        onRefresh={refreshData}
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
