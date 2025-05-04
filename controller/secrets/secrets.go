package secrets

import "os"

var JwtSecret = getJwtSecret()

func getJwtSecret() []byte {
	secret := os.Getenv("JwtSecret")
	if secret == "" {
		secret = "cristiano-ronaldo-ist-der-beste-spieler-der-welt"
	}
	return []byte(secret)
}
