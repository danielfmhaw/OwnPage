package handlers

import (
	"controller/models"
	"controller/utils"
	"encoding/json"
	"net/http"
	"strconv"
)

func WarehousePartHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetWareHouseParts(w, r)
	case http.MethodDelete:
		DeleteWarehousePart(w, r)
	case http.MethodPut:
		UpdateWarehousePart(w, r)
	case http.MethodPost:
		InsertWarehousePart(w, r)
	default:
		http.Error(w, utils.ErrMsgMethodNotAllowed, http.StatusMethodNotAllowed)
	}
}

func GetWareHouseParts(w http.ResponseWriter, r *http.Request) {
	query := utils.MustReadSQLFile("selects/warehousepartsselect.sql")

	utils.HandleGetForDataTable(w, r, query, func(scanner utils.Scanner) (any, error) {
		var p models.WarehousePartWithName
		err := scanner.Scan(&p.ID, &p.PartType, &p.PartID, &p.PartName, &p.Quantity, &p.StorageLocation, &p.ProjectID)
		return p, err
	})
}

func DeleteWarehousePart(w http.ResponseWriter, r *http.Request) {
	// ID aus der URL oder Anfrage extrahieren
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, utils.ErrMsgIdMissing, http.StatusBadRequest)
		return
	}

	// Convert string ID to integer
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, utils.ErrMsgIdInvalid, http.StatusBadRequest)
		return
	}

	projectIdQuery := "SELECT project_id FROM warehouse_parts WHERE id = $1"
	utils.HandleDelete(w, r, "DELETE FROM warehouse_parts WHERE id = $1", []string{}, projectIdQuery, []interface{}{id}, id)
}

func UpdateWarehousePart(w http.ResponseWriter, r *http.Request) {
	// Extrahiere die neuen Werte aus dem Request Body, inklusive der ID
	var part models.WarehousePart
	err := json.NewDecoder(r.Body).Decode(&part)
	if err != nil {
		http.Error(w, utils.ErrMsgProcessingRequest, http.StatusBadRequest)
		return
	}

	if part.ID == 0 {
		http.Error(w, utils.ErrMsgIdMissing, http.StatusBadRequest)
		return
	}

	// Verwende die HandleUpdate-Funktion, um das Update in der DB auszuführen
	query := `UPDATE warehouse_parts SET part_type = $1, part_id = $2, quantity = $3, storage_location = $4, project_id = $5 WHERE id = $6`
	args := []any{part.PartType, part.PartID, part.Quantity, part.StorageLocation, part.ProjectID, part.ID}
	err = utils.HandleUpdate(w, r, query, part.ProjectID, nil, args...)
}

func InsertWarehousePart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, utils.ErrMsgPostOnly, http.StatusMethodNotAllowed)
		return
	}

	// Extrahiere die neuen Werte aus dem Request Body
	var part models.WarehousePart
	err := json.NewDecoder(r.Body).Decode(&part)
	if err != nil {
		http.Error(w, utils.ErrMsgProcessingRequest, http.StatusBadRequest)
		return
	}

	// Verwende die HandleInsert-Funktion, um das Insert in der DB auszuführen
	query := `INSERT INTO warehouse_parts (project_id, part_type, part_id, quantity, storage_location) VALUES ($1, $2, $3, $4, $5)`
	args := []any{part.ProjectID, part.PartType, part.PartID, part.Quantity, part.StorageLocation}
	err = utils.HandleInsert(w, r, query, part.ProjectID, nil, args...)
}
