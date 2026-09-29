# Contrato de conectores de pago

Los conectores financieros utilizados por Payment Intents deben exponer la misma interfaz asíncrona:

```js
await connector.execute({
    intentId,
    amountInMinorUnits,
    currency,
    recipientId,
    idempotencyKey,
});

await connector.getStatus(providerReference);
```

## Reglas

- `execute` debe ser idempotente por `idempotencyKey`.
- Repetir la misma clave y carga devuelve el resultado original.
- Reutilizar una clave con otra carga produce un conflicto explícito.
- La respuesta debe incluir estado y referencia del proveedor.
- Un conector no modifica el ledger ni balances por su cuenta.
- El simulador siempre devuelve `simulation: true` y nunca contacta redes financieras.
