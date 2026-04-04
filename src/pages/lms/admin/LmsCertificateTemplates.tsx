import React, { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Preview as PreviewIcon
} from '@mui/icons-material'
import SignaturePad from '../../../Components/Maintenance/SignaturePad'
import {
  useCertificateTemplates,
  useCreateCertificateTemplate,
  useDeleteCertificateTemplate,
  usePreviewCertificateTemplate,
  useUpdateCertificateTemplate
} from '../../../hooks/useLms'
import type {
  CertificateTemplate,
  CertificateTemplateVariable,
  SaveCertificateTemplateRequest
} from '../../../services/lmsService'
import { sanitizeHtml } from '../../../utils/htmlSanitizer'
import certificateTemplateBackground from 'src/assets/template.png'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface TemplateFormState {
  name: string
  templateHtml: string
  templateCss: string
  isDefault: boolean
  variables: CertificateTemplateVariable[]
}

const DEFAULT_VARIABLES: CertificateTemplateVariable[] = [
  {
    name: 'userName',
    label: 'Nombre del usuario',
    type: 'text',
    required: true,
    description: 'Nombre completo del estudiante'
  },
  {
    name: 'courseTitle',
    label: 'Nombre del curso',
    type: 'text',
    required: true,
    description: 'Titulo del curso completado'
  },
  {
    name: 'completionDate',
    label: 'Fecha de finalizacion',
    type: 'date',
    required: true,
    description: 'Fecha en que se completo el curso'
  },
  {
    name: 'courseDuration',
    label: 'Duracion del curso',
    type: 'text',
    required: false,
    description: 'Texto libre para la duracion visible en el certificado'
  },
  {
    name: 'certificateBackgroundImage',
    label: 'Fondo oficial del certificado',
    type: 'text',
    required: false,
    defaultValue: '/images/template.png',
    description: 'Imagen base que se usara como arte principal del certificado'
  },
  {
    name: 'leftSignatureImage',
    label: 'Firma izquierda',
    type: 'text',
    required: false,
    description: 'Imagen base64 de la firma izquierda'
  },
  {
    name: 'leftSignatureDisplay',
    label: 'Visualizacion de firma izquierda',
    type: 'text',
    required: false,
    defaultValue: 'none',
    description: 'Control interno para mostrar u ocultar la firma izquierda'
  },
  {
    name: 'leftSignerName',
    label: 'Nombre izquierda',
    type: 'text',
    required: false,
    defaultValue: 'Daniel Paredes',
    description: 'Nombre que se mostrara bajo la firma izquierda'
  },
  {
    name: 'leftSignerRole',
    label: 'Cargo izquierda',
    type: 'text',
    required: false,
    defaultValue: 'Instructor',
    description: 'Cargo que se mostrara bajo la firma izquierda'
  },
  {
    name: 'rightSignatureImage',
    label: 'Firma derecha',
    type: 'text',
    required: false,
    description: 'Imagen base64 de la firma derecha'
  },
  {
    name: 'rightSignatureDisplay',
    label: 'Visualizacion de firma derecha',
    type: 'text',
    required: false,
    defaultValue: 'none',
    description: 'Control interno para mostrar u ocultar la firma derecha'
  },
  {
    name: 'rightSignerName',
    label: 'Nombre derecha',
    type: 'text',
    required: false,
    defaultValue: 'Andres Felipe Espitia',
    description: 'Nombre que se mostrara bajo la firma derecha'
  },
  {
    name: 'rightSignerRole',
    label: 'Cargo derecha',
    type: 'text',
    required: false,
    defaultValue: 'Director Tecnico',
    description: 'Cargo que se mostrara bajo la firma derecha'
  },
  {
    name: 'certificateNumber',
    label: 'Numero de certificado',
    type: 'text',
    required: true,
    description: 'Identificador unico del certificado'
  }
]

const DEFAULT_TEMPLATE_HTML = `
<div class="certificate certificate-template-official">
  <div class="side-left"></div>
  <div class="side-right"></div>
  <div class="top-band"></div>
  <div class="inner-border"></div>
  <div class="inner-border-2"></div>

  <svg class="corner corner-tl" viewBox="0 0 88 88" fill="none"><path d="M8 8 L42 8" stroke="#c9a84c" stroke-width="1.5"/><path d="M8 8 L8 42" stroke="#c9a84c" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="#c9a84c"/><path d="M15 8 L15 15 L8 15" stroke="#c9a84c" stroke-width=".7" opacity=".45"/><path d="M38 8 Q38 22 22 38 Q14 42 8 42" stroke="#c9a84c" stroke-width=".7" fill="none" opacity=".3"/></svg>
  <svg class="corner corner-tr" viewBox="0 0 88 88" fill="none"><path d="M8 8 L42 8" stroke="#c9a84c" stroke-width="1.5"/><path d="M8 8 L8 42" stroke="#c9a84c" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="#c9a84c"/><path d="M15 8 L15 15 L8 15" stroke="#c9a84c" stroke-width=".7" opacity=".45"/><path d="M38 8 Q38 22 22 38 Q14 42 8 42" stroke="#c9a84c" stroke-width=".7" fill="none" opacity=".3"/></svg>
  <svg class="corner corner-bl" viewBox="0 0 88 88" fill="none"><path d="M8 8 L42 8" stroke="#c9a84c" stroke-width="1.5"/><path d="M8 8 L8 42" stroke="#c9a84c" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="#c9a84c"/><path d="M15 8 L15 15 L8 15" stroke="#c9a84c" stroke-width=".7" opacity=".45"/><path d="M38 8 Q38 22 22 38 Q14 42 8 42" stroke="#c9a84c" stroke-width=".7" fill="none" opacity=".3"/></svg>
  <svg class="corner corner-br" viewBox="0 0 88 88" fill="none"><path d="M8 8 L42 8" stroke="#c9a84c" stroke-width="1.5"/><path d="M8 8 L8 42" stroke="#c9a84c" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="#c9a84c"/><path d="M15 8 L15 15 L8 15" stroke="#c9a84c" stroke-width=".7" opacity=".45"/><path d="M38 8 Q38 22 22 38 Q14 42 8 42" stroke="#c9a84c" stroke-width=".7" fill="none" opacity=".3"/></svg>

  <div class="wave-l"><svg viewBox="0 0 55 400" fill="none"><path d="M28 0 Q52 50 28 100 Q4 150 28 200 Q52 250 28 300 Q4 350 28 400" stroke="#2d9e45" stroke-width="1.5" fill="none"/><path d="M38 0 Q62 50 38 100 Q14 150 38 200 Q62 250 38 300 Q14 350 38 400" stroke="#2d9e45" stroke-width="1" fill="none" opacity=".5"/></svg></div>
  <div class="wave-r"><svg viewBox="0 0 55 400" fill="none"><path d="M28 0 Q52 50 28 100 Q4 150 28 200 Q52 250 28 300 Q4 350 28 400" stroke="#2d9e45" stroke-width="1.5" fill="none"/><path d="M38 0 Q62 50 38 100 Q14 150 38 200 Q62 250 38 300 Q14 350 38 400" stroke="#2d9e45" stroke-width="1" fill="none" opacity=".5"/></svg></div>

  <div class="web-strip">
    <div class="dot"></div>
    <span class="ws-text">www.metromedics.co</span>
    <div class="dot"></div>
  </div>

  <div class="verification">
    <div class="verif-wrap">
      <div class="verif-box">
        <span class="verif-gem l">◆</span>
        <span class="verif-gem r">◆</span>
        <div class="verif-label">Codigo de Verificacion</div>
        <div class="verif-code">{{certificateNumber}}</div>
      </div>
    </div>
    <div class="verif-dots">
      <span>◆</span><span>◆</span><span>◆</span>
    </div>
  </div>

  <div class="content">
    <div class="logo-area">
      <img class="logo-image" src="{{organizationLogo}}" alt="Metromedics" />
      <div class="logo-tagline">Metromedics S.A.S. · Calibracion de Precision</div>
    </div>

    <svg class="orn-divider" viewBox="0 0 260 12" fill="none">
      <line x1="0" y1="6" x2="100" y2="6" stroke="#c9a84c" stroke-width=".8" opacity=".5"/>
      <polygon points="106,6 110,3 114,6 110,9" fill="#c9a84c" opacity=".7"/>
      <polygon points="116,6 120,2 124,6 120,10" fill="#c9a84c"/>
      <polygon points="126,6 130,3 134,6 130,9" fill="#c9a84c" opacity=".7"/>
      <line x1="140" y1="6" x2="260" y2="6" stroke="#c9a84c" stroke-width=".8" opacity=".5"/>
      <circle cx="120" cy="6" r="1.8" fill="#c9a84c"/>
    </svg>

    <div class="heading-certificado">CERTIFICADO</div>
    <div class="subheading-row">
      <div class="orn-line"></div>
      <div class="subheading-text">De Capacitacion</div>
      <div class="orn-line r"></div>
    </div>

    <div class="certifica-label">Se certifica que:</div>

    <div class="field-name">{{userName}}</div>

    <div class="desc-block">
      <p>Ha participado y aprobado satisfactoriamente la capacitacion en:</p>
    </div>

    <div class="field-course">{{courseTitle}}</div>

    <div class="detail-text">
      con una intensidad de <strong>{{courseDuration}}</strong>, realizada el dia <strong>{{completionDate}}</strong>
    </div>

    <div class="center-divider">
      <div class="cdiv-line"></div>
      <div class="cdiv-orn">✦ ✦ ✦</div>
      <div class="cdiv-line"></div>
    </div>

    <div class="footer">
      <div class="footer-block">
        <div class="signature-stage" style="display: {{leftSignatureDisplay}};">
          <img class="signature-image" src="{{leftSignatureImage}}" alt="Firma izquierda" />
        </div>
        <div class="footer-person">{{leftSignerName}}</div>
        <div class="footer-sig-line"></div>
        <div class="footer-role-title">{{leftSignerRole}}</div>
      </div>

      <div class="seal">
        <svg class="seal-ring" viewBox="0 0 74 74" fill="none">
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="74" y2="74" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#3ab554"/><stop offset="100%" stop-color="#0d4a1c"/>
            </linearGradient>
          </defs>
          <circle cx="37" cy="37" r="35" fill="none" stroke="#c9a84c" stroke-width="1" stroke-dasharray="4 2.8" opacity=".65"/>
          <circle cx="37" cy="37" r="30" fill="url(#sg)"/>
          <circle cx="37" cy="37" r="26" fill="none" stroke="rgba(232,201,106,.45)" stroke-width="1"/>
          <path d="M24 37 L32 45 L50 29" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <text x="16" y="24" font-size="7" fill="#e8c96a" opacity=".75" font-family="serif">★</text>
          <text x="50" y="24" font-size="7" fill="#e8c96a" opacity=".75" font-family="serif">★</text>
        </svg>
        <div class="seal-name">METROMEDICS S.A.S.</div>
        <div class="seal-nit">NIT: 900816433</div>
      </div>

      <div class="footer-block">
        <div class="signature-stage" style="display: {{rightSignatureDisplay}};">
          <img class="signature-image" src="{{rightSignatureImage}}" alt="Firma derecha" />
        </div>
        <div class="footer-person">{{rightSignerName}}</div>
        <div class="footer-sig-line"></div>
        <div class="footer-role-title">{{rightSignerRole}}</div>
      </div>
    </div>
  </div>
</div>
`.trim()

const DEFAULT_TEMPLATE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700;900&family=Lato:wght@300;400;700&display=swap');

:root {
  --gold-light: #e8c96a;
  --gold-mid: #c9a84c;
  --green-deep: #0d4a1c;
  --green-rich: #1a6b2a;
  --green-mid: #2d9e45;
  --cream: #fdfaf4;
}

@page {
  size: A4 landscape;
  margin: 0;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #ffffff;
}

.certificate-template-official.certificate {
  width: 297mm;
  height: 210mm;
  margin: 0;
  background: var(--cream);
  position: relative;
  overflow: hidden;
  box-shadow: none;
  font-family: 'Lato', sans-serif;
}

.certificate-template-official .side-left,
.certificate-template-official .side-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 7px;
  z-index: 3;
  background: linear-gradient(180deg, var(--green-deep) 0%, var(--green-mid) 35%, var(--gold-mid) 50%, var(--green-mid) 65%, var(--green-deep) 100%);
}

.certificate-template-official .side-left { left: 0; }
.certificate-template-official .side-right { right: 0; }
.certificate-template-official .top-band {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 118px;
  z-index: 1;
  background: linear-gradient(180deg, var(--green-deep) 0%, var(--green-rich) 75%, transparent 100%);
  clip-path: polygon(0 0, 100% 0, 100% 78%, 53% 100%, 47% 100%, 0 78%);
}

.certificate-template-official .top-band::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-light) 30%, var(--gold-mid) 50%, var(--gold-light) 70%, transparent);
}

.certificate-template-official .inner-border { position: absolute; inset: 18px; border: 1px solid rgba(201,168,76,.45); z-index: 2; pointer-events: none; }
.certificate-template-official .inner-border-2 { position: absolute; inset: 23px; border: .5px solid rgba(201,168,76,.2); z-index: 2; pointer-events: none; }
.certificate-template-official .corner { position: absolute; width: 88px; height: 88px; z-index: 5; pointer-events: none; }
.certificate-template-official .corner-tl { top: 8px; left: 8px; }
.certificate-template-official .corner-tr { top: 8px; right: 8px; transform: scaleX(-1); }
.certificate-template-official .corner-bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
.certificate-template-official .corner-br { bottom: 8px; right: 8px; transform: scale(-1,-1); }
.certificate-template-official .wave-l, .certificate-template-official .wave-r { position: absolute; top: 115px; bottom: 80px; width: 55px; z-index: 2; opacity: .14; pointer-events: none; }
.certificate-template-official .wave-l { left: 26px; }
.certificate-template-official .wave-r { right: 26px; transform: scaleX(-1); }

.certificate-template-official .web-strip {
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 20px;
  z-index: 10;
  background: linear-gradient(90deg, var(--green-deep), var(--green-rich), var(--green-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.certificate-template-official .ws-text {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: rgba(255,255,255,.65);
  text-transform: uppercase;
}

.certificate-template-official .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--gold-mid); opacity: .7; }
.certificate-template-official .verification { position: absolute; bottom: 13px; right: 44px; z-index: 10; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; text-align: right; }
.certificate-template-official .verif-box { border: none; padding: 0; background: transparent; box-shadow: none; }
.certificate-template-official .verif-gem, .certificate-template-official .verif-dots { display: none; }
.certificate-template-official .verif-label { font-size: 7px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(184,168,122,.8); }
.certificate-template-official .verif-code { font-family: 'Cinzel', serif; font-size: 10px; font-weight: 600; letter-spacing: 1.6px; color: rgba(26,107,42,.9); line-height: 1.1; }

.certificate-template-official .content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 210mm;
  padding: 10px 88px 68px;
  box-sizing: border-box;
}

.certificate-template-official .logo-area { padding-top: 34px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.certificate-template-official .logo-image { width: 280px; max-width: 100%; object-fit: contain; display: block; }
.certificate-template-official .logo-tagline { font-size: 8px; font-weight: 700; letter-spacing: 5px; color: rgba(255,255,255,.6); text-transform: uppercase; }
.certificate-template-official .orn-divider { margin-top: 8px; width: 260px; height: 12px; opacity: .65; }
.certificate-template-official .heading-certificado { font-family: 'Cinzel', serif; font-size: 58px; font-weight: 900; letter-spacing: 9px; text-transform: uppercase; line-height: 1; margin-top: 26px; background: linear-gradient(90deg, var(--green-rich) 0%, var(--gold-light) 35%, var(--gold-mid) 50%, var(--gold-light) 65%, var(--green-rich) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.certificate-template-official .subheading-row { display: flex; align-items: center; gap: 12px; margin-top: 3px; width: 580px; }
.certificate-template-official .orn-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-mid)); }
.certificate-template-official .orn-line.r { background: linear-gradient(90deg, var(--gold-mid), transparent); }
.certificate-template-official .subheading-text { font-family: 'Cinzel', serif; font-size: 10.5px; font-weight: 600; letter-spacing: 5.5px; color: var(--green-rich); text-transform: uppercase; white-space: nowrap; }
.certificate-template-official .certifica-label { font-family: 'Cormorant Garamond', serif; font-size: 13.5px; font-style: italic; color: #777; letter-spacing: .5px; margin-top: 10px; }

.certificate-template-official .field-name,
.certificate-template-official .field-course {
  width: 620px;
  border: 1.5px solid var(--green-mid);
  border-radius: 4px;
  background: rgba(45,158,69,.05);
  text-align: center;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(7,59,40,.14);
}

.certificate-template-official .field-name { margin-top: 6px; min-height: 58px; padding: 5px 28px; position: relative; }
.certificate-template-official .field-course { margin-top: 7px; min-height: 58px; padding: 5px 22px; }
.certificate-template-official .field-name::before,
.certificate-template-official .field-name::after { content: '◆'; position: absolute; top: 50%; transform: translateY(-50%); font-size: 7px; color: var(--gold-mid); opacity: .6; }
.certificate-template-official .field-name::before { left: 10px; }
.certificate-template-official .field-name::after { right: 10px; }
.certificate-template-official .official-fit { display: block; width: 100%; text-align: center; word-break: break-word; hyphens: auto; }
.certificate-template-official .name-value { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; font-style: italic; color: var(--green-deep); letter-spacing: .5px; line-height: 1.02; }
.certificate-template-official .course-value { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--green-deep); letter-spacing: 3px; text-transform: uppercase; line-height: 1.12; }
.certificate-template-official .official-fit--recipient.is-compact { font-size: 19px; }
.certificate-template-official .official-fit--recipient.is-xcompact { font-size: 17px; }
.certificate-template-official .official-fit--course.is-compact { font-size: 12px; }
.certificate-template-official .official-fit--course.is-xcompact { font-size: 11px; }
.certificate-template-official .official-fit--course.is-xxcompact { font-size: 9.8px; letter-spacing: 2px; }
.certificate-template-official .desc-block { margin-top: 7px; text-align: center; line-height: 1.55; }
.certificate-template-official .desc-block p { font-size: 11.5px; color: #444; }
.certificate-template-official .detail-text { margin-top: 7px; text-align: center; font-size: 11px; color: #555; line-height: 1.6; }
.certificate-template-official .center-divider { margin-top: 16px; width: 100%; display: flex; align-items: center; gap: 10px; }
.certificate-template-official .cdiv-line { flex: 1; height: .5px; background: rgba(201,168,76,.4); }
.certificate-template-official .cdiv-orn { font-size: 9px; color: var(--gold-mid); letter-spacing: 4px; font-family: 'Cinzel', serif; opacity: .85; }
.certificate-template-official .footer { margin-top: 56px; padding-bottom: 6px; display: flex; align-items: flex-end; justify-content: space-between; width: 100%; }
.certificate-template-official .footer-block { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 180px; }
.certificate-template-official .signature-stage { min-height: 52px; display: flex; align-items: flex-end; justify-content: center; width: 100%; }
.certificate-template-official .signature-image { max-width: 150px; max-height: 46px; object-fit: contain; object-position: center bottom; background: transparent; }
.certificate-template-official .footer-person { font-size: 11px; color: #555; }
.certificate-template-official .footer-sig-line { width: 130px; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-mid), transparent); }
.certificate-template-official .footer-role-title { font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: var(--green-rich); letter-spacing: 1.5px; }
.certificate-template-official .seal { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.certificate-template-official .seal-ring { width: 74px; height: 74px; }
.certificate-template-official .seal-name { font-family: 'Cinzel', serif; font-size: 9.5px; font-weight: 700; color: var(--green-rich); letter-spacing: 1.5px; }
.certificate-template-official .seal-nit { font-size: 8.5px; color: #888; letter-spacing: 1px; }
`.trim()

const CERTIFICATE_HTML_SNIPPETS = [
  { label: 'Nombre del usuario', token: '{{userName}}' },
  { label: 'Curso', token: '{{courseTitle}}' },
  { label: 'Fecha', token: '{{completionDate}}' },
  { label: 'Duracion', token: '{{courseDuration}}' },
  { label: 'Fondo', token: '{{certificateBackgroundImage}}' },
  { label: 'Firma izquierda', token: '{{leftSignatureImage}}' },
  { label: 'Firma derecha', token: '{{rightSignatureImage}}' },
  { label: 'Certificado', token: '{{certificateNumber}}' }
]

const VARIABLE_NAME_SUGGESTIONS = [
  'userName',
  'courseTitle',
  'completionDate',
  'courseDuration',
  'courseDurationDisplay',
  'certificateMetaGridColumns',
  'certificateNumber',
  'organizationName',
  'organizationLogo',
  'certificateBackgroundImage',
  'leftSignatureImage',
  'leftSignatureDisplay',
  'leftSignerName',
  'leftSignerRole',
  'rightSignatureImage',
  'rightSignatureDisplay',
  'rightSignerName',
  'rightSignerRole',
  'organizationSignature',
  'organizationSignatureDisplay'
]

const emptyFormState = (): TemplateFormState => ({
  name: '',
  templateHtml: DEFAULT_TEMPLATE_HTML,
  templateCss: DEFAULT_TEMPLATE_CSS,
  isDefault: false,
  variables: DEFAULT_VARIABLES
})

const ensureVariable = (
  variables: CertificateTemplateVariable[],
  variableName: string,
  fallback: CertificateTemplateVariable
) => {
  const existingIndex = variables.findIndex((variable) => variable.name === variableName)
  if (existingIndex >= 0) {
    const nextVariables = [...variables]
    nextVariables[existingIndex] = {
      ...fallback,
      ...nextVariables[existingIndex]
    }
    return nextVariables
  }

  return [...variables, fallback]
}

const setManagedVariable = (
  variables: CertificateTemplateVariable[],
  variableName: string,
  fallback: CertificateTemplateVariable,
  nextValue: string
) =>
  ensureVariable(variables, variableName, fallback).map((variable) =>
    variable.name === variableName
      ? {
          ...variable,
          defaultValue: nextValue
        }
      : variable
  )

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`certificate-template-tabpanel-${index}`}
      aria-labelledby={`certificate-template-tab-${index}`}
      {...other}
    >
      {value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null}
    </div>
  )
}

const normalizeTemplate = (template: CertificateTemplate): TemplateFormState => {
  const normalizedVariables =
    template.variables?.length > 0
      ? template.variables.map((variable) => ({
          ...variable,
          defaultValue: variable.defaultValue ?? variable.default_value ?? ''
        }))
      : DEFAULT_VARIABLES

  const legacySignature = normalizedVariables.find((variable) => variable.name === 'organizationSignature')
  const withBackground = ensureVariable(normalizedVariables, 'certificateBackgroundImage', {
    name: 'certificateBackgroundImage',
    label: 'Fondo oficial del certificado',
    type: 'text',
    required: false,
    defaultValue: '/images/template.png',
    description: 'Imagen base que se usara como arte principal del certificado'
  })
  const withLeftSignature = ensureVariable(withBackground, 'leftSignatureImage', {
    name: 'leftSignatureImage',
    label: 'Firma izquierda',
    type: 'text',
    required: false,
    defaultValue: legacySignature?.defaultValue || '',
    description: 'Imagen base64 de la firma izquierda'
  })
  const withLeftDisplay = ensureVariable(withLeftSignature, 'leftSignatureDisplay', {
    name: 'leftSignatureDisplay',
    label: 'Visualizacion de firma izquierda',
    type: 'text',
    required: false,
    defaultValue: legacySignature?.defaultValue ? 'flex' : 'none',
    description: 'Control interno para mostrar u ocultar la firma izquierda'
  })
  const withSignerMeta = ([
    {
      name: 'leftSignerName',
      label: 'Nombre izquierda',
      type: 'text',
      required: false,
      defaultValue: 'Daniel Paredes',
      description: 'Nombre que se mostrara bajo la firma izquierda'
    },
    {
      name: 'leftSignerRole',
      label: 'Cargo izquierda',
      type: 'text',
      required: false,
      defaultValue: 'Instructor',
      description: 'Cargo que se mostrara bajo la firma izquierda'
    },
    {
      name: 'rightSignatureImage',
      label: 'Firma derecha',
      type: 'text',
      required: false,
      defaultValue: '',
      description: 'Imagen base64 de la firma derecha'
    },
    {
      name: 'rightSignatureDisplay',
      label: 'Visualizacion de firma derecha',
      type: 'text',
      required: false,
      defaultValue: 'none',
      description: 'Control interno para mostrar u ocultar la firma derecha'
    },
    {
      name: 'rightSignerName',
      label: 'Nombre derecha',
      type: 'text',
      required: false,
      defaultValue: 'Andres Felipe Espitia',
      description: 'Nombre que se mostrara bajo la firma derecha'
    },
    {
      name: 'rightSignerRole',
      label: 'Cargo derecha',
      type: 'text',
      required: false,
      defaultValue: 'Director Tecnico',
      description: 'Cargo que se mostrara bajo la firma derecha'
    }
  ] as CertificateTemplateVariable[]).reduce(
    (acc, variable) => ensureVariable(acc, variable.name, variable),
    withLeftDisplay
  )

  return {
    name: template.name || '',
    templateHtml: template.templateHtml || template.template_html || '',
    templateCss:
      template.templateCss ||
      template.template_css ||
      ((template.templateHtml || template.template_html || '').includes('certificate-template-official')
        ? DEFAULT_TEMPLATE_CSS
        : ''),
    isDefault: template.isDefault ?? template.is_default ?? false,
    variables: withSignerMeta
  }
}

const buildSamplePreviewHtml = (
  templateHtml: string,
  templateCss: string,
  variables: CertificateTemplateVariable[]
) => {
  const sampleValues = variables.reduce<Record<string, string>>((acc, variable) => {
    if (variable.defaultValue || variable.default_value) {
      acc[variable.name] = variable.defaultValue || variable.default_value || ''
      return acc
    }

    if (variable.type === 'date') {
      acc[variable.name] = new Date().toLocaleDateString('es-CO')
      return acc
    }

    if (variable.type === 'number') {
      acc[variable.name] = '40'
      return acc
    }

    if (variable.name === 'userName') {
      acc[variable.name] = 'Laura Betancur'
      return acc
    }

    if (variable.name === 'courseTitle') {
      acc[variable.name] = 'Curso de Seguridad y Calidad'
      return acc
    }

    if (variable.name === 'certificateNumber') {
      acc[variable.name] = 'MMCS-PREVIEW-001'
      return acc
    }

    if (variable.name === 'courseDuration') {
      acc[variable.name] = '40 horas'
      return acc
    }

    if (variable.name === 'courseDurationDisplay') {
      acc[variable.name] = 'flex'
      return acc
    }

    if (variable.name === 'certificateMetaGridColumns') {
      acc[variable.name] = 'repeat(3, minmax(0, 1fr))'
      return acc
    }

    if (variable.name === 'organizationLogo') {
      acc[variable.name] = typeof window !== 'undefined'
        ? `${window.location.origin}/images/logo2.png`
        : '/images/logo2.png'
      return acc
    }

    if (variable.name === 'certificateBackgroundImage') {
      acc[variable.name] = certificateTemplateBackground
      return acc
    }

    if (variable.name === 'leftSignatureImage' || variable.name === 'rightSignatureImage' || variable.name === 'organizationSignature') {
      acc[variable.name] =
        variable.defaultValue ||
        variable.default_value ||
        ''
      return acc
    }

    if (variable.name === 'leftSignatureDisplay') {
      const signatureValue = acc.leftSignatureImage
      acc[variable.name] = signatureValue ? 'flex' : 'none'
      return acc
    }

    if (variable.name === 'rightSignatureDisplay') {
      const signatureValue = acc.rightSignatureImage
      acc[variable.name] = signatureValue ? 'flex' : 'none'
      return acc
    }

    if (variable.name === 'organizationSignatureDisplay') {
      const signatureValue = acc.organizationSignature || acc.leftSignatureImage
      acc[variable.name] = signatureValue ? 'flex' : 'none'
      return acc
    }

    acc[variable.name] = variable.label || variable.name
    return acc
  }, {})

  const renderedHtml = templateHtml.replace(/\{\{(\w+)\}\}/g, (_, variableName: string) => sampleValues[variableName] || '')
  const renderedCss = templateCss.replace(
    /\{\{(\w+)\}\}/g,
    (_, variableName: string) => sampleValues[variableName] || ''
  )
  const shellClass = renderedHtml.includes('certificate-template-official')
    ? 'certificate-preview-shell certificate-preview-shell--artwork'
    : 'certificate-preview-shell'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #eef6f1;
      font-family: Arial, sans-serif;
    }

    .certificate-preview-shell {
      width: 100%;
      min-height: 620px;
      padding: 24px;
      background:
        radial-gradient(circle at top right, rgba(49, 177, 99, 0.14), transparent 30%),
        radial-gradient(circle at bottom left, rgba(24, 49, 83, 0.10), transparent 32%),
        linear-gradient(180deg, #fbfffc 0%, #eef7f2 100%);
      border: 4px solid #1f3958;
      border-radius: 18px;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
    }

    .certificate-preview-shell--artwork {
      padding: 0;
      border: none;
      border-radius: 0;
      background: #ffffff;
      min-height: 680px;
    }

    .certificate-template-official {
      position: relative;
      width: 100%;
      min-height: 750px;
      overflow: hidden;
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.98) 0%, rgba(253,250,244,0.98) 55%, rgba(244,250,246,0.98) 100%);
      font-family: 'Lato', Arial, sans-serif;
      color: #1a1a18;
    }

    .certificate-official-side {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 7px;
      z-index: 2;
      background: linear-gradient(180deg, #0d4a1c 0%, #2d9e45 35%, #c9a84c 50%, #2d9e45 65%, #0d4a1c 100%);
    }

    .certificate-official-side--left { left: 0; }
    .certificate-official-side--right { right: 0; }

    .certificate-official-top-band {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 118px;
      z-index: 0;
      background: linear-gradient(180deg, #0d4a1c 0%, #1a6b2a 75%, transparent 100%);
      clip-path: polygon(0 0, 100% 0, 100% 78%, 53% 100%, 47% 100%, 0 78%);
    }

    .certificate-official-inner-border {
      position: absolute;
      inset: 18px;
      border: 1px solid rgba(201, 168, 76, 0.45);
      z-index: 1;
      pointer-events: none;
    }

    .certificate-official-inner-border--soft {
      inset: 23px;
      border-color: rgba(201, 168, 76, 0.2);
    }

    .certificate-official-corner {
      position: absolute;
      width: 88px;
      height: 88px;
      z-index: 3;
      pointer-events: none;
    }

    .certificate-official-corner::before,
    .certificate-official-corner::after {
      content: '';
      position: absolute;
      background: #c9a84c;
    }

    .certificate-official-corner::before {
      top: 0;
      left: 0;
      width: 38px;
      height: 2px;
    }

    .certificate-official-corner::after {
      top: 0;
      left: 0;
      width: 2px;
      height: 38px;
    }

    .certificate-official-corner--tl { top: 8px; left: 8px; }
    .certificate-official-corner--tr { top: 8px; right: 8px; transform: scaleX(-1); }
    .certificate-official-corner--bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
    .certificate-official-corner--br { bottom: 8px; right: 8px; transform: scale(-1, -1); }

    .certificate-official-wave {
      position: absolute;
      top: 118px;
      bottom: 84px;
      width: 56px;
      z-index: 1;
      opacity: 0.18;
    }

    .certificate-official-wave::before,
    .certificate-official-wave::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 0 12px, transparent 0 28px, rgba(45, 158, 69, 0.32) 29px 30px, transparent 31px) 0 0 / 100% 120px repeat-y;
    }

    .certificate-official-wave::after {
      transform: translateX(10px);
      opacity: 0.6;
    }

    .certificate-official-wave--left { left: 24px; }
    .certificate-official-wave--right { right: 24px; transform: scaleX(-1); }

    .certificate-official-watermark {
      position: absolute;
      right: 72px;
      top: 168px;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background:
        linear-gradient(135deg, rgba(77, 180, 105, 0.10), rgba(13, 74, 28, 0.04)),
        radial-gradient(circle at center, rgba(255,255,255,0.2), rgba(255,255,255,0));
      z-index: 0;
    }

    .certificate-official-watermark::before,
    .certificate-official-watermark::after {
      content: '';
      position: absolute;
      inset: 24px 52px;
      border: 8px solid rgba(13, 74, 28, 0.14);
      transform: skewX(-8deg);
    }

    .certificate-official-watermark::after {
      inset: 10px 34px;
      border-width: 5px;
      border-color: rgba(255, 255, 255, 0.72);
    }

    .certificate-official-content {
      position: relative;
      z-index: 4;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      padding: 14px 88px 80px;
      box-sizing: border-box;
    }

    .certificate-official-logo-area {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 6px;
    }

    .certificate-official-logo {
      width: 360px;
      max-width: 100%;
      object-fit: contain;
    }

    .certificate-official-title {
      margin-top: 18px;
      font-family: 'Cinzel', Georgia, serif;
      font-size: 66px;
      font-weight: 900;
      letter-spacing: 0.06em;
      line-height: 0.95;
      text-transform: uppercase;
      color: #0d5a3d;
      text-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
    }

    .certificate-official-subtitle-row {
      margin-top: 10px;
      width: 66%;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .certificate-official-subtitle-line {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, transparent, #17664a, transparent);
    }

    .certificate-official-subtitle-text {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #1f2b24;
      white-space: nowrap;
    }

    .certificate-official-certify-label {
      margin-top: 16px;
      font-size: 18px;
      font-weight: 700;
      color: #222;
    }

    .certificate-official-copy {
      margin-top: 10px;
      text-align: center;
      font-size: 17px;
      color: #222;
      line-height: 1.45;
    }

    .certificate-official-field {
      width: 72%;
      text-align: center;
      border: 3px solid #0d5a3d;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(7, 59, 40, 0.18);
      padding: 10px 26px;
      box-sizing: border-box;
    }

    .certificate-official-field--name {
      margin-top: 10px;
      min-height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .certificate-official-field--course {
      margin-top: 14px;
      min-height: 78px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .certificate-official-inline {
      display: block;
      width: 100%;
      text-align: center;
      word-break: break-word;
      hyphens: auto;
    }

    .certificate-official-inline--recipient {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 42px;
      font-weight: 700;
      line-height: 1.02;
      font-style: italic;
      color: #0d4a3b;
    }

    .certificate-official-inline--recipient.is-compact { font-size: 36px; }
    .certificate-official-inline--recipient.is-xcompact { font-size: 31px; }

    .certificate-official-inline--course {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0d4a3b;
    }

    .certificate-official-inline--course.is-compact { font-size: 21px; }
    .certificate-official-inline--course.is-xcompact { font-size: 18px; }
    .certificate-official-inline--course.is-xxcompact { font-size: 16px; }

    .certificate-official-detail {
      margin-top: 12px;
      max-width: 74%;
      text-align: center;
      font-size: 16px;
      color: #272727;
      line-height: 1.55;
    }

    .certificate-official-divider {
      margin-top: 14px;
      width: 86%;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .certificate-official-divider-line {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, transparent, #0d4a3b, transparent);
    }

    .certificate-official-divider-orn {
      font-size: 26px;
      color: #0d4a3b;
      line-height: 1;
    }

    .magnitudes {
      margin-top: 14px;
      width: 86%;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 6px;
    }

    .mag-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      color: #1a1a18;
      line-height: 1.2;
      padding: 0 10px;
      position: relative;
    }

    .mag-item:not(:last-child)::after {
      content: '';
      position: absolute;
      right: -4px;
      top: 10px;
      width: 1px;
      height: 42px;
      background: linear-gradient(180deg, transparent, rgba(13, 74, 59, 0.35), transparent);
    }

    .mag-hex {
      width: 56px;
      height: 56px;
      overflow: visible;
    }

    .mag-label {
      font-size: 13px;
      line-height: 1.2;
      font-weight: 700;
      color: #1a1a18;
    }

    .certificate-official-footer {
      margin-top: auto;
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: end;
      gap: 18px;
      padding-bottom: 40px;
    }

    .certificate-official-signature {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .certificate-official-signature-stage {
      position: relative;
      min-height: 56px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-end;
    }

    .certificate-official-signature-stage::before {
      content: '';
      position: absolute;
      inset: 8px 18px 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.94));
      border-radius: 18px;
      box-shadow: 0 10px 30px rgba(255,255,255,0.95);
    }

    .certificate-official-signature-image {
      position: relative;
      z-index: 1;
      max-width: 170px;
      max-height: 46px;
      object-fit: contain;
      object-position: center bottom;
      background: transparent;
    }

    .certificate-official-signature-line {
      width: 72%;
      border-top: 2px solid rgba(201, 168, 76, 0.9);
    }

    .certificate-official-signature-name {
      font-size: 18px;
      color: #202020;
    }

    .certificate-official-signature-role {
      font-size: 14px;
      font-weight: 800;
      color: #0d5a3d;
    }

    .certificate-official-company-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 260px;
      padding: 10px 26px 12px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,252,247,0.98));
      border: 3px solid rgba(7, 88, 60, 0.92);
      box-shadow: 0 8px 18px rgba(11, 79, 56, 0.14);
    }

    .certificate-official-company-pill strong {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 18px;
      color: #102b22;
      letter-spacing: 0.04em;
    }

    .certificate-official-company-pill span {
      margin-top: 6px;
      font-size: 13px;
      color: #fff;
      padding: 4px 18px;
      border-radius: 999px;
      background: linear-gradient(180deg, #15915d, #0d6b49);
    }

    .certificate-official-verification {
      position: absolute;
      right: 42px;
      bottom: 48px;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;
    }

    .certificate-official-verification-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      color: #b8a87a;
    }

    .certificate-official-verification-value {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: #0d5a3d;
      background: linear-gradient(135deg, rgba(253,250,244,0.97) 0%, rgba(245,239,220,0.97) 100%);
      border: 1px solid rgba(201, 168, 76, 0.55);
      border-radius: 6px;
      padding: 8px 16px;
      box-shadow: 0 1px 10px rgba(201, 168, 76, 0.14);
    }

    .certificate-official-web-strip {
      position: absolute;
      left: 7px;
      right: 7px;
      bottom: 0;
      height: 22px;
      z-index: 4;
      background: linear-gradient(90deg, #0d4a1c, #1a6b2a, #0d4a1c);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    .certificate-official-web-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #c9a84c;
      opacity: 0.7;
    }
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700;900&family=Lato:wght@300;400;700&display=swap');

    .certificate-template-official.certificate {
      width: 100%;
      min-height: 720px;
      background: var(--cream, #fdfaf4);
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 0 1px rgba(201,168,76,.4), 0 12px 48px rgba(0,0,0,.25);
      font-family: 'Lato', sans-serif;
    }

    .certificate-template-official .side-left,
    .certificate-template-official .side-right {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 7px;
      z-index: 3;
      background: linear-gradient(180deg, #0d4a1c 0%, #2d9e45 35%, #c9a84c 50%, #2d9e45 65%, #0d4a1c 100%);
    }

    .certificate-template-official .side-left { left: 0; }
    .certificate-template-official .side-right { right: 0; }
    .certificate-template-official .top-band { position: absolute; top: 0; left: 0; right: 0; height: 118px; z-index: 1; background: linear-gradient(180deg, #0d4a1c 0%, #1a6b2a 75%, transparent 100%); clip-path: polygon(0 0, 100% 0, 100% 78%, 53% 100%, 47% 100%, 0 78%); }
    .certificate-template-official .top-band::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #e8c96a 30%, #c9a84c 50%, #e8c96a 70%, transparent); }
    .certificate-template-official .inner-border { position: absolute; inset: 18px; border: 1px solid rgba(201,168,76,.45); z-index: 2; pointer-events: none; }
    .certificate-template-official .inner-border-2 { position: absolute; inset: 23px; border: .5px solid rgba(201,168,76,.2); z-index: 2; pointer-events: none; }
    .certificate-template-official .corner { position: absolute; width: 88px; height: 88px; z-index: 5; pointer-events: none; }
    .certificate-template-official .corner-tl { top: 8px; left: 8px; }
    .certificate-template-official .corner-tr { top: 8px; right: 8px; transform: scaleX(-1); }
    .certificate-template-official .corner-bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
    .certificate-template-official .corner-br { bottom: 8px; right: 8px; transform: scale(-1,-1); }
    .certificate-template-official .wave-l, .certificate-template-official .wave-r { position: absolute; top: 115px; bottom: 80px; width: 55px; z-index: 2; opacity: .14; pointer-events: none; }
    .certificate-template-official .wave-l { left: 26px; }
    .certificate-template-official .wave-r { right: 26px; transform: scaleX(-1); }
    .certificate-template-official .web-strip { position: absolute; bottom: 0; left: 7px; right: 7px; height: 20px; z-index: 10; background: linear-gradient(90deg, #0d4a1c, #1a6b2a, #0d4a1c); display: flex; align-items: center; justify-content: center; gap: 8px; }
    .certificate-template-official .ws-text { font-family: 'Lato', sans-serif; font-size: 8.5px; font-weight: 700; letter-spacing: 2.5px; color: rgba(255,255,255,.65); text-transform: uppercase; }
    .certificate-template-official .dot { width: 3px; height: 3px; border-radius: 50%; background: #c9a84c; opacity: .7; }
    .certificate-template-official .verification { position: absolute; bottom: 13px; right: 44px; z-index: 10; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; text-align: right; }
    .certificate-template-official .verif-wrap { position: relative; padding: 0; }
    .certificate-template-official .verif-wrap::before, .certificate-template-official .verif-wrap::after { content: none; }
    .certificate-template-official .verif-box { border: none; border-radius: 0; padding: 0; background: transparent; box-shadow: none; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; position: relative; }
    .certificate-template-official .verif-gem { display: none; }
    .certificate-template-official .verif-gem.l { left: -9px; }
    .certificate-template-official .verif-gem.r { right: -9px; }
    .certificate-template-official .verif-label { font-family: 'Lato', sans-serif; font-size: 7px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(184,168,122,.8); }
    .certificate-template-official .verif-code { font-family: 'Cinzel', serif; font-size: 10px; font-weight: 600; letter-spacing: 1.6px; color: rgba(26,107,42,.9); line-height: 1.1; }
    .certificate-template-official .verif-dots { display: none; }
    .certificate-template-official .content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; height: 100%; padding: 10px 88px 68px; box-sizing: border-box; }
    .certificate-template-official .logo-area { padding-top: 34px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .certificate-template-official .logo-image { width: 280px; max-width: 100%; object-fit: contain; display: block; }
    .certificate-template-official .logo-tagline { font-family: 'Lato', sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 5px; color: rgba(255,255,255,.6); text-transform: uppercase; }
    .certificate-template-official .orn-divider { margin-top: 8px; width: 260px; height: 12px; opacity: .65; }
    .certificate-template-official .heading-certificado { font-family: 'Cinzel', serif; font-size: 58px; font-weight: 900; letter-spacing: 9px; text-transform: uppercase; line-height: 1; margin-top: 26px; background: linear-gradient(90deg, #1a6b2a 0%, #e8c96a 35%, #c9a84c 50%, #e8c96a 65%, #1a6b2a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .certificate-template-official .subheading-row { display: flex; align-items: center; gap: 12px; margin-top: 3px; width: 580px; }
    .certificate-template-official .orn-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #c9a84c); }
    .certificate-template-official .orn-line.r { background: linear-gradient(90deg, #c9a84c, transparent); }
    .certificate-template-official .subheading-text { font-family: 'Cinzel', serif; font-size: 10.5px; font-weight: 600; letter-spacing: 5.5px; color: #1a6b2a; text-transform: uppercase; white-space: nowrap; }
    .certificate-template-official .certifica-label { font-family: 'Cormorant Garamond', serif; font-size: 13.5px; font-style: italic; color: #777; letter-spacing: .5px; margin-top: 10px; }
    .certificate-template-official .field-name, .certificate-template-official .field-course { width: 620px; border: 1.5px solid #2d9e45; border-radius: 4px; background: rgba(45,158,69,.05); text-align: center; box-sizing: border-box; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(7,59,40,.14); }
    .certificate-template-official .field-name { margin-top: 6px; min-height: 58px; padding: 5px 28px; position: relative; }
    .certificate-template-official .field-course { margin-top: 7px; min-height: 58px; padding: 5px 22px; }
    .certificate-template-official .field-name::before, .certificate-template-official .field-name::after { content: '◆'; position: absolute; top: 50%; transform: translateY(-50%); font-size: 7px; color: #c9a84c; opacity: .6; }
    .certificate-template-official .field-name::before { left: 10px; }
    .certificate-template-official .field-name::after { right: 10px; }
    .certificate-template-official .official-fit { display: block; width: 100%; text-align: center; word-break: break-word; hyphens: auto; }
    .certificate-template-official .name-value { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; font-style: italic; color: #0d4a1c; letter-spacing: .5px; line-height: 1.02; }
    .certificate-template-official .course-value { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: #0d4a1c; letter-spacing: 3px; text-transform: uppercase; line-height: 1.12; }
    .certificate-template-official .official-fit--recipient.is-compact { font-size: 19px; }
    .certificate-template-official .official-fit--recipient.is-xcompact { font-size: 17px; }
    .certificate-template-official .official-fit--course.is-compact { font-size: 12px; }
    .certificate-template-official .official-fit--course.is-xcompact { font-size: 11px; }
    .certificate-template-official .official-fit--course.is-xxcompact { font-size: 9.8px; letter-spacing: 2px; }
    .certificate-template-official .desc-block { margin-top: 7px; text-align: center; line-height: 1.55; }
    .certificate-template-official .desc-block p { font-family: 'Lato', sans-serif; font-size: 11.5px; color: #444; }
    .certificate-template-official .detail-text { margin-top: 7px; text-align: center; font-family: 'Lato', sans-serif; font-size: 11px; color: #555; line-height: 1.6; }
    .certificate-template-official .center-divider { margin-top: 16px; width: 100%; display: flex; align-items: center; gap: 10px; }
    .certificate-template-official .cdiv-line { flex: 1; height: .5px; background: rgba(201,168,76,.4); }
    .certificate-template-official .cdiv-orn { font-size: 9px; color: #c9a84c; letter-spacing: 4px; font-family: 'Cinzel', serif; opacity: .85; }
    .certificate-template-official .magnitudes { display: flex; align-items: flex-start; justify-content: center; margin-top: 10px; width: 100%; }
    .certificate-template-official .mag-item { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 0 18px; position: relative; }
    .certificate-template-official .mag-item:not(:last-child)::after { content: ''; position: absolute; right: 0; top: 8px; height: 36px; width: 1px; background: linear-gradient(180deg, transparent, rgba(201,168,76,.35), transparent); }
    .certificate-template-official .mag-hex { width: 50px; height: 50px; }
    .certificate-template-official .mag-label { font-family: 'Lato', sans-serif; font-size: 9.5px; font-weight: 700; color: #1a6b2a; text-align: center; line-height: 1.35; text-transform: uppercase; letter-spacing: .2px; }
    .certificate-template-official .footer { margin-top: 56px; padding-top: 0; padding-bottom: 6px; display: flex; align-items: flex-end; justify-content: space-between; width: 100%; }
    .certificate-template-official .footer-block { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 180px; }
    .certificate-template-official .signature-stage { min-height: 52px; display: flex; align-items: flex-end; justify-content: center; width: 100%; }
    .certificate-template-official .signature-image { max-width: 150px; max-height: 46px; object-fit: contain; object-position: center bottom; background: transparent; }
    .certificate-template-official .footer-person { font-family: 'Lato', sans-serif; font-size: 11px; color: #555; }
    .certificate-template-official .footer-sig-line { width: 130px; height: 1px; background: linear-gradient(90deg, transparent, #c9a84c, transparent); }
    .certificate-template-official .footer-role-title { font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: #1a6b2a; letter-spacing: 1.5px; }
    .certificate-template-official .seal { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .certificate-template-official .seal-ring { width: 74px; height: 74px; }
    .certificate-template-official .seal-name { font-family: 'Cinzel', serif; font-size: 9.5px; font-weight: 700; color: #1a6b2a; letter-spacing: 1.5px; }
    .certificate-template-official .seal-nit { font-family: 'Lato', sans-serif; font-size: 8.5px; color: #888; letter-spacing: 1px; }
${renderedCss}
  </style>
</head>
<body>
  <div class="${shellClass}">
    ${sanitizeHtml(renderedHtml, 'richText')}
  </div>
</body>
</html>`
}

const LmsCertificateTemplates: React.FC = () => {
  const [tab, setTab] = useState(0)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<CertificateTemplate | null>(null)
  const [form, setForm] = useState<TemplateFormState>(emptyFormState)

  const { data: templates = [], isLoading, refetch } = useCertificateTemplates()
  const createTemplateMutation = useCreateCertificateTemplate({
    onSuccess: () => handleCloseEditor()
  })
  const updateTemplateMutation = useUpdateCertificateTemplate({
    onSuccess: () => handleCloseEditor()
  })
  const deleteTemplateMutation = useDeleteCertificateTemplate()
  const {
    data: previewData,
    isLoading: isPreviewLoading
  } = usePreviewCertificateTemplate(previewTemplate?.id, {
    enabled: !!previewTemplate?.id
  })

  const localPreviewHtml = useMemo(
    () => buildSamplePreviewHtml(form.templateHtml, form.templateCss, form.variables),
    [form.templateHtml, form.templateCss, form.variables]
  )

  const serverPreviewHtml = useMemo(
    () => previewData?.fullHtml || previewData?.html || '',
    [previewData?.fullHtml, previewData?.html]
  )

  const isSaving =
    createTemplateMutation.isLoading ||
    updateTemplateMutation.isLoading ||
    deleteTemplateMutation.isLoading

  const templateCards = useMemo(
    () =>
      templates.map((template) => ({
        ...template,
        normalized: normalizeTemplate(template)
      })),
    [templates]
  )

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingTemplate(null)
    setForm(emptyFormState())
    setTab(0)
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setForm(emptyFormState())
    setTab(0)
    setIsEditorOpen(true)
  }

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template)
    setForm(normalizeTemplate(template))
    setTab(0)
    setIsEditorOpen(true)
  }

  const handleDuplicate = (template: CertificateTemplate) => {
    const normalized = normalizeTemplate(template)
    setEditingTemplate(null)
    setForm({
      ...normalized,
      name: `${normalized.name} (Copia)`,
      isDefault: false
    })
    setTab(0)
    setIsEditorOpen(true)
  }

  const handleDelete = async (template: CertificateTemplate) => {
    setTemplateToDelete(template)
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) {
      return
    }

    await deleteTemplateMutation.mutateAsync(templateToDelete.id)
    setTemplateToDelete(null)
  }

  const handleSave = async () => {
    const payload: SaveCertificateTemplateRequest = {
      name: form.name.trim(),
      templateHtml: form.templateHtml.trim(),
      templateCss: form.templateCss,
      isDefault: form.isDefault,
      variables: form.variables
        .filter((variable) => variable.name.trim())
        .map((variable) => ({
          ...variable,
          name: variable.name.trim(),
          label: variable.label.trim() || variable.name.trim(),
          defaultValue: variable.defaultValue?.trim() || ''
        }))
    }

    if (editingTemplate) {
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        data: payload
      })
      return
    }

    await createTemplateMutation.mutateAsync(payload)
  }

  const updateVariable = (
    index: number,
    field: keyof CertificateTemplateVariable,
    value: string | boolean
  ) => {
    const nextVariables = [...form.variables]
    nextVariables[index] = {
      ...nextVariables[index],
      [field]: value
    }
    setForm((current) => ({
      ...current,
      variables: nextVariables
    }))
  }

  const addVariable = () => {
    setForm((current) => ({
      ...current,
      variables: [
        ...current.variables,
        {
          name: '',
          label: '',
          type: 'text',
          required: true,
          defaultValue: '',
          description: ''
        }
      ]
    }))
  }

  const removeVariable = (index: number) => {
    setForm((current) => ({
      ...current,
      variables: current.variables.filter((_, variableIndex) => variableIndex !== index)
    }))
  }

  const handleSignatureChange = (
    signatureName: 'leftSignatureImage' | 'rightSignatureImage',
    displayName: 'leftSignatureDisplay' | 'rightSignatureDisplay',
    nextValue: string | null
  ) => {
    setForm((current) => {
      const signatureLabel = signatureName === 'leftSignatureImage' ? 'Firma izquierda' : 'Firma derecha'
      const displayLabel =
        displayName === 'leftSignatureDisplay'
          ? 'Visualizacion de firma izquierda'
          : 'Visualizacion de firma derecha'

      const withSignature = ensureVariable(current.variables, signatureName, {
        name: signatureName,
        label: signatureLabel,
        type: 'text',
        required: false,
        defaultValue: nextValue || '',
        description: `Imagen base64 de la ${signatureLabel.toLowerCase()}`
      })

      const withDisplay = ensureVariable(withSignature, displayName, {
        name: displayName,
        label: displayLabel,
        type: 'text',
        required: false,
        defaultValue: nextValue ? 'flex' : 'none',
        description: `Control interno para mostrar u ocultar la ${signatureLabel.toLowerCase()}`
      }).map((variable) => {
        if (variable.name === signatureName) {
          return {
            ...variable,
            defaultValue: nextValue || ''
          }
        }

        if (variable.name === displayName) {
          return {
            ...variable,
            defaultValue: nextValue ? 'flex' : 'none'
          }
        }

        return variable
      })

      return {
        ...current,
        variables: withDisplay
      }
    })
  }

  const updateManagedTextVariable = (
    variableName: string,
    fallback: CertificateTemplateVariable,
    nextValue: string
  ) => {
    setForm((current) => ({
      ...current,
      variables: setManagedVariable(current.variables, variableName, fallback, nextValue)
    }))
  }

  const leftSignatureVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'leftSignatureImage'),
    [form.variables]
  )
  const rightSignatureVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'rightSignatureImage'),
    [form.variables]
  )
  const leftSignerNameVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'leftSignerName'),
    [form.variables]
  )
  const leftSignerRoleVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'leftSignerRole'),
    [form.variables]
  )
  const rightSignerNameVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'rightSignerName'),
    [form.variables]
  )
  const rightSignerRoleVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'rightSignerRole'),
    [form.variables]
  )

  const applyVariableSuggestion = (index: number, value: string) => {
    const matchingDefault = DEFAULT_VARIABLES.find((variable) => variable.name === value)
    if (matchingDefault) {
      const nextVariables = [...form.variables]
      nextVariables[index] = {
        ...nextVariables[index],
        ...matchingDefault,
        defaultValue: nextVariables[index].defaultValue || matchingDefault.defaultValue || ''
      }
      setForm((current) => ({
        ...current,
        variables: nextVariables
      }))
      return
    }

    updateVariable(index, 'name', value)
  }

  const insertTokenIntoHtml = (token: string) => {
    setForm((current) => ({
      ...current,
      templateHtml: `${current.templateHtml}\n${token}`
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
          mb: 3
        }}
      >
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            Plantillas de Certificados
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Administra el diseno base de los certificados generados por el LMS.
          </Typography>
        </Box>

        <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
          Nueva Plantilla
        </Button>
      </Box>

      <Alert severity='info' sx={{ mb: 3 }}>
        Gestiona aquí el diseño oficial del certificado. La plantilla marcada como{' '}
        <strong>por defecto</strong> se usará automáticamente al emitir nuevos certificados.
      </Alert>

      {isLoading ? (
        <Typography color='text.secondary'>Cargando plantillas...</Typography>
      ) : templateCards.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h6' gutterBottom>
            No hay plantillas registradas
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Crea la primera plantilla para controlar el formato de los certificados.
          </Typography>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
            Crear Plantilla
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {templateCards.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant='h6'>{template.name}</Typography>
                      {template.isDefault || template.is_default ? (
                        <Chip label='Por defecto' color='primary' size='small' />
                      ) : null}
                    </Box>
                  }
                  action={
                    <Box>
                      <Tooltip title='Vista previa'>
                        <IconButton onClick={() => setPreviewTemplate(template)}>
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Editar'>
                        <IconButton onClick={() => handleEdit(template)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Duplicar'>
                        <IconButton onClick={() => handleDuplicate(template)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Eliminar'>
                        <span>
                          <IconButton
                            color='error'
                            onClick={() => handleDelete(template)}
                            disabled={template.isDefault || template.is_default}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Variables configuradas: {template.normalized.variables.length}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {template.normalized.variables.slice(0, 4).map((variable) => (
                      <Chip
                        key={`${template.id}-${variable.name}`}
                        label={variable.label}
                        size='small'
                        variant='outlined'
                      />
                    ))}
                  </Box>

                  <Typography variant='caption' color='text.secondary'>
                    Actualizada:{' '}
                    {new Date(
                      template.updatedAt || template.updated_at || template.createdAt || template.created_at || Date.now()
                    ).toLocaleDateString('es-CO')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={isEditorOpen} onClose={handleCloseEditor} fullWidth maxWidth='lg'>
        <DialogTitle>
          {editingTemplate ? 'Editar Plantilla de Certificado' : 'Nueva Plantilla de Certificado'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mt: 1 }}>
            <Tab label='Ficha' />
            <Tab label='HTML' />
            <Tab label='CSS' />
            <Tab label='Variables' />
            <Tab label='Vista previa' />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity='info'>
                  Define primero el nombre interno de la plantilla y si será la opción base para
                  certificados nuevos.
                </Alert>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label='Nombre'
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isDefault}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isDefault: event.target.checked }))
                      }
                    />
                  }
                  label='Plantilla por defecto'
                />
              </Grid>
              <Grid item xs={12}>
                <Card variant='outlined'>
                  <CardHeader
                    title='Plantilla oficial y firmas'
                    subheader='La base del certificado usa una imagen oficial y dos bloques de firma configurables para nombre, cargo e imagen.'
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Alert severity='success'>
                          Fondo oficial activo: <strong>/images/template.png</strong>. Si mañana
                          cambian las personas, solo actualizas nombre, cargo o la firma
                          correspondiente.
                        </Alert>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card variant='outlined'>
                          <CardHeader
                            title='Firma izquierda'
                            subheader='Normalmente usada para instructor o responsable academico.'
                          />
                          <CardContent>
                            <SignaturePad
                              value={
                                leftSignatureVariable?.defaultValue ||
                                leftSignatureVariable?.default_value ||
                                ''
                              }
                              onChange={(nextValue) =>
                                handleSignatureChange(
                                  'leftSignatureImage',
                                  'leftSignatureDisplay',
                                  nextValue
                                )
                              }
                              label='Firma izquierda'
                              helperText='Puedes dibujarla o subir una imagen con fondo transparente.'
                              height={150}
                            />
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Nombre'
                                  value={
                                    leftSignerNameVariable?.defaultValue ||
                                    leftSignerNameVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'leftSignerName',
                                      {
                                        name: 'leftSignerName',
                                        label: 'Nombre izquierda',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Daniel Paredes',
                                        description: 'Nombre que se mostrara bajo la firma izquierda'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Cargo'
                                  value={
                                    leftSignerRoleVariable?.defaultValue ||
                                    leftSignerRoleVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'leftSignerRole',
                                      {
                                        name: 'leftSignerRole',
                                        label: 'Cargo izquierda',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Instructor',
                                        description: 'Cargo que se mostrara bajo la firma izquierda'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card variant='outlined'>
                          <CardHeader
                            title='Firma derecha'
                            subheader='Normalmente usada para director tecnico, gerente o aprobador final.'
                          />
                          <CardContent>
                            <SignaturePad
                              value={
                                rightSignatureVariable?.defaultValue ||
                                rightSignatureVariable?.default_value ||
                                ''
                              }
                              onChange={(nextValue) =>
                                handleSignatureChange(
                                  'rightSignatureImage',
                                  'rightSignatureDisplay',
                                  nextValue
                                )
                              }
                              label='Firma derecha'
                              helperText='Puedes dibujarla o subir una imagen con fondo transparente.'
                              height={150}
                            />
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Nombre'
                                  value={
                                    rightSignerNameVariable?.defaultValue ||
                                    rightSignerNameVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'rightSignerName',
                                      {
                                        name: 'rightSignerName',
                                        label: 'Nombre derecha',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Andres Felipe Espitia',
                                        description: 'Nombre que se mostrara bajo la firma derecha'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Cargo'
                                  value={
                                    rightSignerRoleVariable?.defaultValue ||
                                    rightSignerRoleVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'rightSignerRole',
                                      {
                                        name: 'rightSignerRole',
                                        label: 'Cargo derecha',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Director Tecnico',
                                        description: 'Cargo que se mostrara bajo la firma derecha'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Alert severity='info' sx={{ mb: 2 }}>
              <AlertTitle>Tokens rápidos</AlertTitle>
              Inserta variables conocidas sin escribirlas a mano. Usa este paso solo para ajustar
              el diseño del certificado.
            </Alert>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {CERTIFICATE_HTML_SNIPPETS.map((snippet) => (
                <Chip
                  key={snippet.token}
                  label={snippet.label}
                  clickable
                  variant='outlined'
                  onClick={() => insertTokenIntoHtml(snippet.token)}
                />
              ))}
            </Box>
            <Paper
              variant='outlined'
              sx={{ overflow: 'hidden', borderRadius: 2, borderColor: 'divider' }}
            >
              <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant='subtitle2'>HTML del certificado</Typography>
              </Box>
              <Editor
                height='560px'
                defaultLanguage='html'
                language='html'
                theme='vs-light'
                value={form.templateHtml}
                onChange={(value) =>
                  setForm((current) => ({ ...current, templateHtml: value || '' }))
                }
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbersMinChars: 3,
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            </Paper>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Alert severity='info' sx={{ mb: 2 }}>
              <AlertTitle>CSS del certificado</AlertTitle>
              Este bloque controla posiciones, tamaños, colores y espaciados. Lo que guardes aqui
              se usara tanto en la vista previa como en el PDF real.
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
              <Button
                size='small'
                variant='outlined'
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    templateCss: DEFAULT_TEMPLATE_CSS
                  }))
                }
              >
                Cargar estilos base
              </Button>
            </Box>
            <Paper
              variant='outlined'
              sx={{ overflow: 'hidden', borderRadius: 2, borderColor: 'divider' }}
            >
              <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant='subtitle2'>CSS del certificado</Typography>
              </Box>
              <Editor
                height='560px'
                defaultLanguage='css'
                language='css'
                theme='vs-light'
                value={form.templateCss}
                onChange={(value) =>
                  setForm((current) => ({ ...current, templateCss: value || '' }))
                }
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbersMinChars: 3,
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            </Paper>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Alert severity='info' sx={{ mb: 2 }}>
              <AlertTitle>Variables guiadas</AlertTitle>
              Usa primero nombres conocidos del sistema para evitar que el certificado quede con
              campos sin reemplazar.
            </Alert>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Typography variant='h6'>Variables dinamicas</Typography>
              <Button variant='outlined' startIcon={<AddIcon />} onClick={addVariable}>
                Agregar variable
              </Button>
            </Box>

            <List disablePadding>
              {form.variables.map((variable, index) => (
                <React.Fragment key={`${variable.name || 'new'}-${index}`}>
                  <ListItem disableGutters sx={{ py: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Nombre</InputLabel>
                          <Select
                            value={variable.name}
                            label='Nombre'
                            onChange={(event) =>
                              applyVariableSuggestion(index, event.target.value)
                            }
                          >
                            <MenuItem value=''>
                              <em>Seleccionar sugerencia</em>
                            </MenuItem>
                            {VARIABLE_NAME_SUGGESTIONS.map((suggestion) => (
                              <MenuItem key={suggestion} value={suggestion}>
                                {suggestion}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label='Etiqueta'
                          value={variable.label}
                          onChange={(event) =>
                            updateVariable(index, 'label', event.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={variable.type}
                            label='Tipo'
                            onChange={(event) =>
                              updateVariable(index, 'type', event.target.value)
                            }
                          >
                            <MenuItem value='text'>Texto</MenuItem>
                            <MenuItem value='date'>Fecha</MenuItem>
                            <MenuItem value='number'>Numero</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label='Valor de ejemplo'
                          value={variable.defaultValue || ''}
                          onChange={(event) =>
                            updateVariable(index, 'defaultValue', event.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={1.5}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={variable.required}
                              onChange={(event) =>
                                updateVariable(index, 'required', event.target.checked)
                              }
                            />
                          }
                          label='Req.'
                        />
                      </Grid>
                      <Grid item xs={12} md={0.5}>
                        <IconButton color='error' onClick={() => removeVariable(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Descripcion'
                          value={variable.description || ''}
                          onChange={(event) =>
                            updateVariable(index, 'description', event.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </ListItem>
                  {index < form.variables.length - 1 ? <Divider /> : null}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Alert severity='info' sx={{ mb: 2 }}>
              La vista previa del editor usa datos de ejemplo locales para que puedas iterar antes
              de guardar.
            </Alert>
            <Paper
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.300',
                overflow: 'auto',
                maxHeight: 700
              }}
            >
              <Box
                component='iframe'
                title='Vista previa local del certificado'
                srcDoc={localPreviewHtml}
                sx={{
                  width: '100%',
                  minHeight: 680,
                  border: 'none',
                  bgcolor: 'common.white'
                }}
              />
            </Paper>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditor}>Cancelar</Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={!form.name.trim() || !form.templateHtml.trim() || isSaving}
          >
            {editingTemplate ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>{previewTemplate?.name || 'Vista previa de plantilla'}</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            Esta vista previa viene del backend real y usa datos de ejemplo del servicio de
            certificados.
          </Alert>
          <Paper
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.300',
              overflow: 'auto',
              minHeight: 320
            }}
          >
            {isPreviewLoading ? (
              <Typography color='text.secondary'>Generando vista previa...</Typography>
            ) : (
              <Box
                component='iframe'
                title='Vista previa del certificado'
                srcDoc={serverPreviewHtml}
                sx={{
                  width: '100%',
                  minHeight: 680,
                  border: 'none',
                  bgcolor: 'common.white'
                }}
              />
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTemplate(null)}>Cerrar</Button>
          <Button onClick={() => refetch()}>Refrescar listado</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Eliminar plantilla</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mt: 1 }}>
            Vas a eliminar la plantilla "{templateToDelete?.name}". Esta acción no se puede
            deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateToDelete(null)}>Cancelar</Button>
          <Button
            color='error'
            variant='contained'
            onClick={handleConfirmDelete}
            disabled={deleteTemplateMutation.isLoading}
          >
            Eliminar plantilla
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsCertificateTemplates
