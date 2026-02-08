package api

type ResponseData struct {
	Id          string `json:"id"`
	File        string `json:"file"`
	Message     string `json:"message"`
	HasAssets   bool   `json:"hasAssets"`
	ExtractPath string
}
