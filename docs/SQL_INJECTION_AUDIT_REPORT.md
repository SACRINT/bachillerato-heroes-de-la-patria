# 🔐 REPORTE DE AUDITORÍA SQL INJECTION

**Fecha:** 17/11/2025, 7:36:00 a.m.
**Script:** backend/scripts/audit-sql-injection.mjs

---

## 📊 RESUMEN

| Métrica | Valor |
|---------|-------|
| Archivos escaneados | 219 |
| Archivos con vulnerabilidades | 90 |
| Total vulnerabilidades | 518 |
| Queries seguras | 0 |

### Por Severidad

| Severidad | Cantidad |
|-----------|----------|
| 🔴 CRITICAL | 28 |
| 🟠 HIGH | 490 |
| 🟡 MEDIUM | 0 |
| 🟢 LOW | 0 |

---

## 🚨 VULNERABILIDADES ENCONTRADAS (90 archivos)

### ⚠️ routes/messaging.js

**Vulnerabilidades:** 30
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 94

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 110

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 141

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 174

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 223

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = c.id AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 249

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 399

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 414

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 461

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 474

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 511

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1`,
            [id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 525

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 587

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 604

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 661

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE message_id = m.id)
```

#### HIGH - Direct variable in WHERE

**Línea:** 749

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $2 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 795

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 810

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 851

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 866

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1`,
            [id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 907

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE message_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 958

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 966

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1010

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1045

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1`,
            [id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 1174

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1228

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1274

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE conversation_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1380

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 1045

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE messages SET total_attachments = total_attachments +
```

### ⚠️ routes/digital-library.js

**Vulnerabilidades:** 26
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 207

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $6
            RETURNING *
        `, [name, slug, description, icon, parent_id, id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 302

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = v_library_documents_full.id
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 349

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = d.id
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 411

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
        `, [id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 429

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 437

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 535

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $3
        `, [version.id, version.version_number, document.id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 631

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $8
            RETURNING *
        `, [title, slug, description, categor
```

#### HIGH - Direct variable in WHERE

**Línea:** 663

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
            RETURNING *
        `, [id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 698

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = $1
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 743

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = $1
        `, [id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 773

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $3
        `, [version.id, version_number, id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 922

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 961

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1043

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1052

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_comment_id = $1
                OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 1061

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1139

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1172

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1221

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = d.id AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1235

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = d.id AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1364

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = v_library_documents_full.id
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1399

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE document_id = v_library_documents_full.id
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1450

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 422

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE library_documents SET total_views = total_views +
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 852

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE library_documents SET total_downloads = total_downloads +
```

### ⚠️ routes/parents.js

**Vulnerabilidades:** 26
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 186

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 219

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${valueIndex}
            RETURNING id, nombre, email, student_id, updated_at
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 319

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 423

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 523

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_id = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 533

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_id = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 545

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 598

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 631

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE student_id = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 660

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE student_id = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 714

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 736

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE student_id = $1
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 762

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo = 'asistencia')
```

#### HIGH - Direct variable in WHERE

**Línea:** 763

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo = 'falta')
```

#### HIGH - Direct variable in WHERE

**Línea:** 764

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo = 'retardo')
```

#### HIGH - Direct variable in WHERE

**Línea:** 765

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo = 'justificada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 767

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE student_id = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 817

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 843

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE student_id = $1
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 868

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estatus = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 869

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estatus = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 870

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estatus = 'pagado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 871

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estatus = 'pagado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 872

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estatus = 'vencido')
```

#### HIGH - Direct variable in WHERE

**Línea:** 874

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE student_id = $1
            ${ciclo_escolar ? `AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 981

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

### ⚠️ routes/support-tickets.js

**Vulnerabilidades:** 25
**Queries seguras:** 0

#### CRITICAL - String concatenation in SELECT

**Línea:** 214

**Descripción:** Query SQL con concatenación de strings en WHERE clause

**Código:**
```sql
SELECT ticket_id FROM support_ticket_watchers
                WHERE user_id = $${paramCount} AND user_role = $${paramCount +
```

#### CRITICAL - String concatenation in SELECT

**Línea:** 297

**Descripción:** Query SQL con concatenación de strings en WHERE clause

**Código:**
```sql
SELECT ticket_id FROM support_ticket_watchers
                WHERE user_id = $${countParamCount} AND user_role = $${countParamCount +
```

#### HIGH - Direct variable in WHERE

**Línea:** 107

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE is_active = TRUE';
```

#### HIGH - Direct variable in WHERE

**Línea:** 215

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $${paramCount} AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 298

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $${countParamCount} AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 337

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
        `, [id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 349

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE ticket_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 357

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE ticket_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 365

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE parent_comment_id = $1
                OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 376

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE ticket_id = $1
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 385

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE ticket_id = $1
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 529

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $7
            RETURNING *
        `, [subject, description, categor
```

#### HIGH - Direct variable in WHERE

**Línea:** 574

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *
        `, [agent_id, agent_role, agent_name, id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 664

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 698

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 802

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *
        `, [userId, userName, resolution_notes, id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 840

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $3
            RETURNING *
        `, [userId, userName, id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 876

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
            RETURNING *
        `, [id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 946

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE ticket_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1052

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE response_sla_overdue = TRUE OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 1102

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE requester_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1110

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE assigned_to_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1119

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1159

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
        `, [id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 1176

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $3
            RETURNING *
        `, [rating, comment, id])
```

### ⚠️ routes/teachers-portal.js

**Vulnerabilidades:** 18
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 184

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE teacher_id = $1 OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 201

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE teacher_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 210

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE teacher_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 216

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE teacher_id = $1`,
            [teacherId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 334

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 456

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 494

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCounter} AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 534

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 638

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 706

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 719

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE class_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 769

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 824

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4`,
            [stats.asistencias, stats.faltas, stats.retardos, session_id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 863

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 907

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE teacher_id = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 1021

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE teacher_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1063

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1108

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE teacher_id = $1 AND
```

### ⚠️ routes/polls.js

**Vulnerabilidades:** 17
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 88

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 91

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 275

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 298

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 299

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 564

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramIndex}
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 602

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 614

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 RETURNING *';
```

#### HIGH - Direct variable in WHERE

**Línea:** 655

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 773

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 807

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE device_type = 'mobile')
```

#### HIGH - Direct variable in WHERE

**Línea:** 808

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE device_type = 'desktop')
```

#### HIGH - Direct variable in WHERE

**Línea:** 809

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE device_type = 'tablet')
```

#### HIGH - Direct variable in WHERE

**Línea:** 811

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 853

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 891

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE active = TRUE
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 922

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1';
```

### ⚠️ services/analyticsService.js

**Vulnerabilidades:** 17
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 222

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'page_view'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 258

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'page_view'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 298

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'educational'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 313

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'educational'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 370

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'engagement'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 382

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'user_action'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 448

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'perfor
```

#### HIGH - Direct variable in WHERE

**Línea:** 463

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'error
```

#### HIGH - Direct variable in WHERE

**Línea:** 473

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'perfor
```

#### HIGH - Direct variable in WHERE

**Línea:** 484

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'perfor
```

#### HIGH - Direct variable in WHERE

**Línea:** 518

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'page_view'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 533

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'page_view'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 561

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_type = 'user_action'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 787

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE active = TRUE
            `)
```

#### HIGH - Direct variable in WHERE

**Línea:** 855

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1
        `, [userId])
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 1023

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE SET
                page_views = analytics_metrics_hourly.page_views +
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 1062

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE SET
                event_count = course_engagement_metrics.event_count +
```

### ⚠️ routes/bolsa-trabajo.js

**Vulnerabilidades:** 15
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 214

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE confirmation_token = $1;
```

#### HIGH - Direct variable in WHERE

**Línea:** 250

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_usuario = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 260

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
                    RETURNING id, uuid, email_usuario, estado;
```

#### HIGH - Direct variable in WHERE

**Línea:** 368

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 409

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'activo')
```

#### HIGH - Direct variable in WHERE

**Línea:** 410

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'inactivo')
```

#### HIGH - Direct variable in WHERE

**Línea:** 411

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'contratado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 414

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE verificado = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 520

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $9
            RETURNING *;
```

#### HIGH - Direct variable in WHERE

**Línea:** 599

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 646

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'nuevo')
```

#### HIGH - Direct variable in WHERE

**Línea:** 647

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'revisado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 648

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'contactado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 828

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 851

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING id, uuid, estado, email_usuario;
```

### ⚠️ data/database-access.js

**Vulnerabilidades:** 15
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 106

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE grado = $1 OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 188

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCount}
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 378

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCount}
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 545

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCount}
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 731

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCount}
            RETURNING id, nombre, email, student_id, created_at, updated_at
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 934

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCount}
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 1123

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCount}
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 1184

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE domain = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 1195

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = 1 OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 1340

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramCount} RETURNING *`,
            values
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 1452

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 1503

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pending')
```

#### HIGH - Direct variable in WHERE

**Línea:** 1504

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'approved')
```

#### HIGH - Direct variable in WHERE

**Línea:** 1505

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'rejected')
```

#### HIGH - Direct variable in WHERE

**Línea:** 1535

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *
        `;
```

### ⚠️ routes/fix-aprobaciones-auto.js

**Vulnerabilidades:** 13
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 26

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 27

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 28

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 39

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 49

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 50

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 51

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 68

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente'
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 103

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 104

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 105

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 106

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'aprobada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 107

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'rechazada')
```

### ⚠️ routes/citas.js

**Vulnerabilidades:** 12
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 96

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            fecha_solicitada = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 127

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            email = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 153

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            email = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 466

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE fecha_solicitada = $1
            GROUP BY hor
```

#### HIGH - Direct variable in WHERE

**Línea:** 513

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE token_confirmacion = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 652

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 653

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'aprobada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 654

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'rechazada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 655

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'completada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 656

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE confirmada = false)
```

#### HIGH - Direct variable in WHERE

**Línea:** 699

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
             RETURNING *`,
            [notas_admin || null, id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 750

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
             RETURNING *`,
            [motivo_rechazo, id]
        )
```

### ⚠️ routes/analytics-dashboard.js

**Vulnerabilidades:** 10
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 34

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 35

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'respondida')
```

#### HIGH - Direct variable in WHERE

**Línea:** 42

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 49

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'approved')
```

#### HIGH - Direct variable in WHERE

**Línea:** 50

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pending')
```

#### HIGH - Direct variable in WHERE

**Línea:** 51

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'rejected')
```

#### HIGH - Direct variable in WHERE

**Línea:** 58

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE verificado = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 66

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 73

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 74

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'aprobada')
```

### ⚠️ routes/archived/citas-improved.js

**Vulnerabilidades:** 10
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 92

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            fecha_solicitada = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 123

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            email = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 149

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            email = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 423

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE fecha_solicitada = $1
            GROUP BY hor
```

#### HIGH - Direct variable in WHERE

**Línea:** 470

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE token_confirmacion = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 609

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 610

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'aprobada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 611

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'rechazada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 612

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'completada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 613

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE confirmada = false)
```

### ⚠️ routes/citas-improved.js

**Vulnerabilidades:** 10
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 94

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            fecha_solicitada = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 125

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            email = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 151

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE
            email = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 425

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE fecha_solicitada = $1
            GROUP BY hor
```

#### HIGH - Direct variable in WHERE

**Línea:** 472

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE token_confirmacion = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 611

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 612

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'aprobada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 613

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'rechazada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 614

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'completada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 615

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE confirmada = false)
```

### ⚠️ routes/notificaciones.js

**Vulnerabilidades:** 10
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 42

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 68

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $5
                RETURNING *;
```

#### HIGH - Direct variable in WHERE

**Línea:** 149

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 190

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'activo')
```

#### HIGH - Direct variable in WHERE

**Línea:** 191

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'inactivo')
```

#### HIGH - Direct variable in WHERE

**Línea:** 192

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'cancelado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 195

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE verificado = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 280

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *;
```

#### HIGH - Direct variable in WHERE

**Línea:** 319

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
            RETURNING id, email
        `, [id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 364

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1 AND
```

### ⚠️ routes/eventos.js

**Vulnerabilidades:** 9
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 232

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'publicado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 233

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'bor
```

#### HIGH - Direct variable in WHERE

**Línea:** 234

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'cancelado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 235

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'finalizado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 236

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE destacado = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 237

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE modalidad = 'presencial')
```

#### HIGH - Direct variable in WHERE

**Línea:** 238

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE modalidad = 'virtual')
```

#### HIGH - Direct variable in WHERE

**Línea:** 239

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE modalidad = 'híbrido')
```

#### HIGH - Direct variable in WHERE

**Línea:** 370

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $20
            RETURNING *;
```

### ⚠️ routes/solicitudes.js

**Vulnerabilidades:** 9
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 186

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 187

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'en_proceso')
```

#### HIGH - Direct variable in WHERE

**Línea:** 188

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'completado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 189

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'rechazado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 190

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE nivel_urgencia = 'urgent')
```

#### HIGH - Direct variable in WHERE

**Línea:** 191

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE nivel_urgencia = 'high')
```

#### HIGH - Direct variable in WHERE

**Línea:** 293

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *;
```

#### HIGH - Direct variable in WHERE

**Línea:** 367

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
             RETURNING *`,
            [notas_admin || null, id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 418

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
             RETURNING *`,
            [motivo, id]
        )
```

### ⚠️ routes/approvals.js

**Vulnerabilidades:** 8
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 63

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pending')
```

#### HIGH - Direct variable in WHERE

**Línea:** 64

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'approved')
```

#### HIGH - Direct variable in WHERE

**Línea:** 65

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'rejected')
```

#### HIGH - Direct variable in WHERE

**Línea:** 66

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_verified = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 112

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 210

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $3
            RETURNING *
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 296

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 317

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *
        `;
```

### ⚠️ routes/inscriptions.js

**Vulnerabilidades:** 8
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 56

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE student_email = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 96

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $8
                    RETURNING *;
```

#### HIGH - Direct variable in WHERE

**Línea:** 299

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pending')
```

#### HIGH - Direct variable in WHERE

**Línea:** 300

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'approved')
```

#### HIGH - Direct variable in WHERE

**Línea:** 301

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'rejected')
```

#### HIGH - Direct variable in WHERE

**Línea:** 302

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'cancelled')
```

#### HIGH - Direct variable in WHERE

**Línea:** 384

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *;
```

#### HIGH - Direct variable in WHERE

**Línea:** 425

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
            RETURNING id, activity_name
        `, [id])
```

### ⚠️ routes/quejas.js

**Vulnerabilidades:** 8
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 79

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 111

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 112

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'en_revision')
```

#### HIGH - Direct variable in WHERE

**Línea:** 113

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'respondida')
```

#### HIGH - Direct variable in WHERE

**Línea:** 114

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE subject = 'queja')
```

#### HIGH - Direct variable in WHERE

**Línea:** 115

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE subject = 'sugerencia')
```

#### HIGH - Direct variable in WHERE

**Línea:** 116

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE subject = 'felicitacion')
```

#### HIGH - Direct variable in WHERE

**Línea:** 188

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *;
```

### ⚠️ routes/suscriptores.js

**Vulnerabilidades:** 8
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 83

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = $1 OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 113

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'activo' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 329

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $6`,
                    [notif_convocator
```

#### HIGH - Direct variable in WHERE

**Línea:** 350

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $6`,
                [notif_convocator
```

#### HIGH - Direct variable in WHERE

**Línea:** 445

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $10
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 493

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE token_verificacion = $1`,
            [token]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 529

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1`,
            [email]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 567

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1`,
            [id]
        )
```

### ⚠️ routes/comunicados.js

**Vulnerabilidades:** 7
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 201

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'publicada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 202

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'bor
```

#### HIGH - Direct variable in WHERE

**Línea:** 203

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE destacada = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 326

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $10
            RETURNING *;
```

#### HIGH - Direct variable in WHERE

**Línea:** 378

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
            RETURNING id, titulo
        `, [id])
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 241

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE comunicados SET vistas = vistas +
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 274

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE comunicados SET vistas = vistas +
```

### ⚠️ routes/diagnostico-aprobaciones.js

**Vulnerabilidades:** 7
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 26

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado='pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 27

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado='aprobada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 28

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado='rechazada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 29

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_confirmado=true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 30

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_confirmado=false)
```

#### HIGH - Direct variable in WHERE

**Línea:** 111

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente'
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 155

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente'
            OR
```

### ⚠️ routes/pendientes-aprobacion.js

**Vulnerabilidades:** 7
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 387

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 388

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'aprobada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 389

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'rechazada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 390

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo_solicitud = 'egresado')
```

#### HIGH - Direct variable in WHERE

**Línea:** 391

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo_solicitud = 'bolsa_trabajo')
```

#### HIGH - Direct variable in WHERE

**Línea:** 392

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo_solicitud = 'egresado' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 393

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo_solicitud = 'bolsa_trabajo' AND
```

### ⚠️ routes/store.js

**Vulnerabilidades:** 7
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 103

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1`,
            [id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 117

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 166

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 FOR
```

#### HIGH - Direct variable in WHERE

**Línea:** 198

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 215

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1`,
            [userId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 236

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $2
            RETURNING balance`,
            [item.price_iacoins, userId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 270

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1`,
                [item_id]
            )
```

### ⚠️ routes/wallet.js

**Vulnerabilidades:** 7
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 41

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1`,
            [userId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 95

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 112

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1`,
            [userId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 169

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $2
            RETURNING balance`,
            [amount, userId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 244

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1`,
            [userId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 273

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $2
            RETURNING balance`,
            [amount, userId]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 364

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $2
            RETURNING balance`,
            [totalCoins, userId]
        )
```

### ⚠️ scripts/auto-fix-aprobaciones-on-startup.js

**Vulnerabilidades:** 7
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 21

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 22

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 23

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 41

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 54

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 55

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 56

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'pendiente' AND
```

### ⚠️ routes/avisos.js

**Vulnerabilidades:** 6
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 202

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'publicada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 203

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'bor
```

#### HIGH - Direct variable in WHERE

**Línea:** 204

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE destacada = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 343

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $10
            RETURNING *;
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 258

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE avisos SET vistas = vistas +
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 291

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE avisos SET vistas = vistas +
```

### ⚠️ routes/challenges.js

**Vulnerabilidades:** 6
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 155

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE challenge_id = $1`,
            [id]
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 191

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 223

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 246

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2`,
                [JSON.stringify(progress)
```

#### HIGH - Direct variable in WHERE

**Línea:** 275

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1`,
                [userId]
            )
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 266

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE SET
                    balance = wallet.balance +
```

### ⚠️ routes/contact.js

**Vulnerabilidades:** 6
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 629

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 672

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pendiente')
```

#### HIGH - Direct variable in WHERE

**Línea:** 673

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'en_revision')
```

#### HIGH - Direct variable in WHERE

**Línea:** 674

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'respondida')
```

#### HIGH - Direct variable in WHERE

**Línea:** 678

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE verificado = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 679

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_sent = true)
```

### ⚠️ routes/grades.js

**Vulnerabilidades:** 6
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 51

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estudiante_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 59

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estudiante_id = $4 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 130

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estudiante_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 138

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estudiante_id = $4 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 459

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estudiante_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 466

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
            `, [Math.round(promedio[0].promedio * 100)
```

### ⚠️ routes/noticias.js

**Vulnerabilidades:** 6
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 203

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'publicada')
```

#### HIGH - Direct variable in WHERE

**Línea:** 204

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'bor
```

#### HIGH - Direct variable in WHERE

**Línea:** 205

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE destacada = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 328

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $10
            RETURNING *;
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 243

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE noticias SET vistas = vistas +
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 276

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE noticias SET vistas = vistas +
```

### ⚠️ routes/password-recovery.js

**Vulnerabilidades:** 6
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 75

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $3
        `, [recoveryToken, tokenExpiration, result.rows[0].id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 175

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = $1';
```

#### HIGH - Direct variable in WHERE

**Línea:** 216

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'pending')
```

#### HIGH - Direct variable in WHERE

**Línea:** 217

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'processed')
```

#### HIGH - Direct variable in WHERE

**Línea:** 218

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE status = 'expired')
```

#### HIGH - Direct variable in WHERE

**Línea:** 255

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4
            RETURNING *;
```

### ⚠️ services/calendarService.js

**Vulnerabilidades:** 6
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 339

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
                `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 486

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramIndex++}`;
```

#### HIGH - Direct variable in WHERE

**Línea:** 515

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
                `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 591

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 593

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
            `;
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 486

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE calendar_events SET ${fields.join(', ')} WHERE id = $${paramIndex+
```

### ⚠️ routes/egresados.js

**Vulnerabilidades:** 5
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 117

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE confirmation_token = $1;
```

#### HIGH - Direct variable in WHERE

**Línea:** 135

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_usuario = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 139

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $4;
```

#### HIGH - Direct variable in WHERE

**Línea:** 175

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo_solicitud = 'egresados' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 275

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tipo_solicitud = 'egresados' AND
```

### ⚠️ routes/students.js

**Vulnerabilidades:** 5
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 289

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estudiante_id = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 366

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE matricula = $1 OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 476

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $` + updateValues.length,
            updateValues
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 515

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = (SELECT usuario_id FROM estudiantes WHERE id = $1)
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 476

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE estudiantes SET ${setClause} WHERE id = $` +
```

### ⚠️ routes/subscriptions.js

**Vulnerabilidades:** 5
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 51

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 251

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE active = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 252

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE active = false)
```

#### HIGH - Direct variable in WHERE

**Línea:** 291

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE token_verificacion = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 386

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE token_verificacion = $1 AND
```

### ⚠️ scripts/execute-create-digital-library-tables.js

**Vulnerabilidades:** 5
**Queries seguras:** 0

#### CRITICAL - String interpolation in query

**Línea:** 51

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
query(`SELECT COUNT(*) as count FROM ${tableName}
```

#### HIGH - Direct variable in WHERE

**Línea:** 19

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 27

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 35

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE proname = $1)
```

#### HIGH - Direct variable in WHERE

**Línea:** 43

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE trigger_name = $1 AND
```

### ⚠️ scripts/execute-create-messaging-system-tables.js

**Vulnerabilidades:** 5
**Queries seguras:** 0

#### CRITICAL - String interpolation in query

**Línea:** 102

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
query(`SELECT COUNT(*) as count FROM ${tableName}
```

#### HIGH - Direct variable in WHERE

**Línea:** 45

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 60

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 75

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE proname = $1
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 89

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE trigger_name = $1
            AND
```

### ⚠️ scripts/execute-create-support-tickets-tables.js

**Vulnerabilidades:** 5
**Queries seguras:** 0

#### CRITICAL - String interpolation in query

**Línea:** 51

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
query(`SELECT COUNT(*) as count FROM ${tableName}
```

#### HIGH - Direct variable in WHERE

**Línea:** 19

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 27

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public' AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 35

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE proname = $1)
```

#### HIGH - Direct variable in WHERE

**Línea:** 43

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE trigger_name = $1 AND
```

### ⚠️ scripts/execute-create-teachers-portal-tables.js

**Vulnerabilidades:** 5
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 58

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 82

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
                AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 99

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE schemaname = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 113

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE proname = 'update_updated_at_column'
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 122

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE trigger_schema = 'public'
            AND
```

### ⚠️ routes/chatbot.js

**Vulnerabilidades:** 4
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 53

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE activo = true`,
            [query.toLowerCase()
```

#### HIGH - Direct variable in WHERE

**Línea:** 223

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $2
        `, [rating, conversation_id])
```

#### HIGH - Direct variable in WHERE

**Línea:** 261

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE categoria = $1
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 297

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE is_active = TRUE
            AND
```

### ⚠️ routes/information.js

**Vulnerabilidades:** 4
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 77

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE is_active = TRUE
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 107

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 310

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $` + updateValues.length + ` AND
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 310

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE informacion_dinamica SET ${setClause} WHERE id = $` +
```

### ⚠️ routes/newsletters-pg.js

**Vulnerabilidades:** 4
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 158

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE active = true
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 263

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $3
        `, [successCount, failureCount, newsletterDbId])
```

#### HIGH - Direct variable in WHERE

**Línea:** 333

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE newsletter_id = $1 LIMIT 1
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 350

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE newsletter_id = $1
            OR
```

### ⚠️ services/cmsService.js

**Vulnerabilidades:** 4
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 313

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
                `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 463

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $${paramIndex++}`;
```

#### HIGH - Direct variable in WHERE

**Línea:** 490

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1';
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 463

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE cms_content SET ${fields.join(', ')} WHERE id = $${paramIndex+
```

### ⚠️ scripts/seed-database-complete.js

**Vulnerabilidades:** 4
**Queries seguras:** 0

#### CRITICAL - String interpolation in query

**Línea:** 154

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
query(`SELECT setval('${tableName}
```

#### CRITICAL - String interpolation in query

**Línea:** 171

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
query(`SELECT COUNT(*) as count FROM ${tableName}
```

#### HIGH - Direct variable in WHERE

**Línea:** 101

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
                    AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 115

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = $1 AND
```

### ⚠️ scripts/verify-polls-tables.js

**Vulnerabilidades:** 4
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 19

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 44

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE routine_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 67

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE event_object_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 97

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ routes/teachers.js

**Vulnerabilidades:** 3
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 481

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $` + updateValues.length,
            updateValues
        )
```

#### HIGH - Direct variable in WHERE

**Línea:** 520

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = (SELECT usuario_id FROM docentes WHERE id = $1)
```

#### CRITICAL - UPDATE with concatenation

**Línea:** 481

**Descripción:** UPDATE con concatenación de strings en SET

**Código:**
```sql
UPDATE docentes SET ${setClause} WHERE id = $` +
```

### ⚠️ data/soft-delete-helpers.js

**Vulnerabilidades:** 3
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 21

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 47

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 72

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
             RETURNING id`,
            [id]
        )
```

### ⚠️ services/notificationService.js

**Vulnerabilidades:** 3
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 286

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 319

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 333

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE user_id = $1 AND
```

### ⚠️ scripts/execute-create-polls-tables.js

**Vulnerabilidades:** 3
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 38

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 78

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE routine_type = 'FUNCTION'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 95

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/migrate-email-confirmado.js

**Vulnerabilidades:** 3
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 34

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_confirmado = true)
```

#### HIGH - Direct variable in WHERE

**Línea:** 35

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_confirmado = false)
```

#### HIGH - Direct variable in WHERE

**Línea:** 47

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name='pendientes_aprobacion'
            OR
```

### ⚠️ routes/archived/migration.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### CRITICAL - String interpolation in query

**Línea:** 335

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
Query(`SELECT COUNT(*) as total FROM ${table}
```

#### CRITICAL - String interpolation in query

**Línea:** 336

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
Query(`SELECT * FROM ${table}
```

### ⚠️ routes/finances.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 25

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 113

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE estado = 'Pendiente'
                OR
```

### ⚠️ routes/install-parents.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 37

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 54

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ routes/install-polls.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 37

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 91

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE poll_id = $1`;
```

### ⚠️ routes/migration.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### CRITICAL - String interpolation in query

**Línea:** 337

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
Query(`SELECT COUNT(*) as total FROM ${table}
```

#### CRITICAL - String interpolation in query

**Línea:** 338

**Descripción:** Template literals usados directamente en query

**Código:**
```sql
Query(`SELECT * FROM ${table}
```

### ⚠️ routes/students-auth.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 32

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email = $1 AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 53

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE usuario_id = $1';
```

### ⚠️ services/emailConfirmationService.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 226

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE confirmation_token = $1
        `;
```

#### HIGH - Direct variable in WHERE

**Línea:** 260

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE id = $1
            RETURNING uuid, email, for
```

### ⚠️ scripts/backup-database-sql.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 66

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 132

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = $1
            OR
```

### ⚠️ scripts/create-bolsa-trabajo-confirmation-table.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 32

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'bolsa_trabajo_pending_confirmation'
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 45

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tablename = 'bolsa_trabajo_pending_confirmation'
            OR
```

### ⚠️ scripts/execute-create-avisos-table.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 28

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 41

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'avisos'
                OR
```

### ⚠️ scripts/execute-create-comunicados-table.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 28

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 41

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'comunicados'
                OR
```

### ⚠️ scripts/execute-create-database-indexes.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 119

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE schemaname = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 157

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE schemaname = 'public'
            AND
```

### ⚠️ scripts/execute-create-eventos-table.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 25

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 37

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'eventos'
                OR
```

### ⚠️ scripts/execute-create-inscripciones-actividades-table.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 28

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 41

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'inscripciones_actividades'
                OR
```

### ⚠️ scripts/execute-create-noticias-table.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 28

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 41

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'noticias'
                OR
```

### ⚠️ scripts/execute-create-parents-portal-tables.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 38

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 62

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/execute-create-pending-submissions-table.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 28

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

#### HIGH - Direct variable in WHERE

**Línea:** 41

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'pending_submissions'
                OR
```

### ⚠️ scripts/migrate-create-pendientes-aprobacion.js

**Vulnerabilidades:** 2
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 51

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'pendientes_aprobacion'
            OR
```

#### HIGH - Direct variable in WHERE

**Línea:** 64

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tablename = 'pendientes_aprobacion'
            OR
```

### ⚠️ routes/analytics.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 527

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE nivel = 'error
```

### ⚠️ services/authService.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 136

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE username = $1 OR
```

### ⚠️ config/database - copia.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 125

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            OR
```

### ⚠️ config/database.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 126

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            OR
```

### ⚠️ scripts/add-unique-constraint.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 16

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = $1 AND
```

### ⚠️ scripts/check-all-tables.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 15

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = '${table}'
            OR
```

### ⚠️ scripts/check-table-structure.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 21

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'estudiantes'
            AND
```

### ⚠️ scripts/delete-wrong-registration.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 34

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE email_usuario = $1 AND
```

### ⚠️ scripts/execute-create-citas-tables.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 39

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/execute-create-core-tables-postgres.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 32

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/execute-create-egresados-table.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 39

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/execute-create-newsletters-tables.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 40

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/execute-create-user-sessions-table.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 42

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'user_sessions'
            OR
```

### ⚠️ scripts/execute-master-setup.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 29

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/execute-migrate-suscriptores.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 29

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/migrate-json-data.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 279

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = ? AND
```

### ⚠️ scripts/run-create-finances-tables.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 149

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_schema = 'public'
            AND
```

### ⚠️ scripts/run-gamification-migration.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 76

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = $1
                )
```

### ⚠️ scripts/run-token-migration.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 68

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE table_name = 'suscriptor
```

### ⚠️ scripts/seed-estudiantes.js

**Vulnerabilidades:** 1
**Queries seguras:** 0

#### HIGH - Direct variable in WHERE

**Línea:** 226

**Descripción:** Variable directa en WHERE sin parametrización

**Código:**
```sql
WHERE tablename = 'estudiantes'
            AND
```

---

## 🔐 RECOMENDACIONES

### ✅ Patrón Seguro (Parametrización PostgreSQL)

```javascript
// ✅ CORRECTO - Parametrización con $1, $2, $3
const query = 'SELECT * FROM usuarios WHERE email = $1 AND active = $2';
const values = [email, true];
const result = await pool.query(query, values);
```

### ❌ Patrón Inseguro (Concatenación)

```javascript
// ❌ INSEGURO - Concatenación de strings (SQL Injection)
const query = "SELECT * FROM usuarios WHERE email = '" + email + "' AND active = true";
const result = await pool.query(query);

// ❌ INSEGURO - Template literals
const query = `SELECT * FROM usuarios WHERE email = '${email}' AND active = true`;
const result = await pool.query(query);
```

---

## ✅ ESTADO FINAL

**Resultado:** ⚠️ 518 vulnerabilidades requieren corrección

**Siguiente paso:** Refactorizar queries inseguras a parametrización
