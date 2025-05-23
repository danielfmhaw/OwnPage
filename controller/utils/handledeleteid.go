package utils

import (
	"github.com/lib/pq"
	"net/http"
	"strings"
)

func HandleDelete(w http.ResponseWriter, r *http.Request, mainQuery string, preQueries []string, projectIdentifier interface{}, projectArgs []interface{}, args ...interface{}) {
	conn, err := ConnectToDB(w)
	if err != nil {
		http.Error(w, ErrMsgDBConnectionFailed, http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	_, err = ValidateProjectAccess(w, r, conn, projectIdentifier, "admin", projectArgs...)
	if err != nil {
		http.Error(w, ErrMsgNoProjectAccess, http.StatusForbidden)
		return
	}

	// Pre-Queries ausführen
	for _, pq := range preQueries {
		var execErr error
		if strings.Contains(pq, "$") {
			_, execErr = conn.Exec(pq, args...)
		} else {
			_, execErr = conn.Exec(pq)
		}
		if execErr != nil {
			HandleError(w, execErr, ErrMsgPreDeleteQueryFailed)
			return
		}
	}

	// Haupt-Löschvorgang
	_, err = conn.Exec(mainQuery, args...)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23503" {
			http.Error(w, ErrMsgRecordReferenced, http.StatusConflict)
			return
		}
		HandleError(w, err, ErrMsgDeleteRecordFailed)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
