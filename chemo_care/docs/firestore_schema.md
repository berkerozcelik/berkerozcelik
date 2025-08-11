# Firestore Collections

## users (collection)
- **id**: user uid
- **email**: string
- **role**: `patient` | `caregiver` | `doctor`

## regimens
- **id**: regimen id
- **name**: string
- **medications**: array of medication ids
- **startDate**: ISO date

## medications
- **id**: medication id
- **name**: string
- **times**: array of HH:mm strings

## symptomEntries
- **id**: entry id
- **type**: symptom type (pain, fever,...)
- **level**: integer 0-10
- **date**: ISO date

## moodEntries
- **id**: entry id
- **mood**: integer -5..5
- **date**: ISO date

## voiceNotes
- **id**: note id
- **text**: transcription
- **sentiment**: double -1..1
- **date**: ISO date

## alerts
- **id**: alert id
- **message**: string
- **level**: red/yellow/green
- **date**: ISO date

## consents
- **privacyAccepted**: bool
- **dataShareAccepted**: bool

## shareLinks
- **id**: link id
- **doctorId**: doctor uid
- **createdAt**: ISO date
