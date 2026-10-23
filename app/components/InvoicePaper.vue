<script setup lang="ts">
import type { Invoice } from '~/utils/invoice'

const props = defineProps<{ invoice: Invoice }>()

const MIN_ROWS = 17
const rows = computed(() => props.invoice.items.filter((i) => i.name || i.qty || i.price))
const blanks = computed(() => Math.max(0, MIN_ROWS - rows.value.length))
const t = computed(() => totals(props.invoice))
</script>

<template>
  <div class="paper">
    <div class="head">
      <div class="brand">
        <img src="/logo.png" alt="Astabali Agro" class="logo" />
        <div class="brand-name">{{ BUSINESS.name }}</div>
      </div>
      <div class="title">INVOICE</div>
      <div class="stamp-wrap">
        <div class="stamp" :class="invoice.status">
          {{ invoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS' }}
        </div>
        <div v-if="invoice.status === 'paid' && invoice.paidAt" class="paid-date">
          Dibayar {{ fmtDate(invoice.paidAt) }}
        </div>
      </div>
    </div>
    <div class="contact">
      <div>{{ BUSINESS.address }}</div>
      <div>Phone: {{ BUSINESS.phone }}</div>
      <div>Email : {{ BUSINESS.email }}</div>
    </div>

    <div class="meta">
      <div class="meta-left">
        <div class="bar">BILL TO</div>
        <div class="val">{{ invoice.customer }}</div>
      </div>
      <div class="meta-right">
        <div class="meta-row bar">
          <div class="c1">INVOICE #</div>
          <div class="c2">DATE</div>
        </div>
        <div class="meta-row val bold">
          <div class="c1">{{ invoice.number }}</div>
          <div class="c2">{{ fmtDate(invoice.date) }}</div>
        </div>
        <div class="meta-row bar" style="margin-top: 18px">
          <div class="c1"></div>
          <div class="c2">Due Date</div>
        </div>
        <div class="meta-row val bold">
          <div class="c1"></div>
          <div class="c2">{{ fmtDate(invoice.dueDate) }}</div>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="l">DESCRIPTION</th>
          <th class="c qty">QTY</th>
          <th class="c price">UNIT PRICE</th>
          <th class="c amt">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(it, idx) in rows" :key="idx">
          <td>{{ it.name }} ({{ it.unit }})</td>
          <td class="c">{{ fmtQty(it.qty || 0) }}</td>
          <td class="r">{{ fmtNum(it.price || 0) }}</td>
          <td class="r">{{ fmtNum(itemAmount(it)) }}</td>
        </tr>
        <tr v-for="n in blanks" :key="'b' + n">
          <td>&nbsp;</td>
          <td></td>
          <td></td>
          <td class="r">-</td>
        </tr>
      </tbody>
    </table>

    <div class="foot">
      <div class="foot-left">
        <div class="thanks">Thank you for your business!</div>
        <div class="pay">Payment Method :</div>
        <div class="pay">{{ BUSINESS.payment }}</div>
      </div>
      <div class="foot-right">
        <div class="line"><span>SUBTOTAL</span><span>{{ fmtNum(t.subtotal) }}</span></div>
        <div class="line"><span>TAX RATE</span><span>{{ invoice.taxRate ? invoice.taxRate + '%' : '' }}</span></div>
        <div class="line"><span>TAX</span><span>{{ t.tax ? fmtNum(t.tax) : '-' }}</span></div>
        <div class="total"><span>TOTAL</span><span>{{ fmtRp(t.total) }}</span></div>
      </div>
    </div>

    <div class="closing">
      <div>If you have any questions about this invoice, please contact</div>
      <div class="bold">Contact {{ BUSINESS.contact }} at {{ BUSINESS.phone }} or {{ BUSINESS.email }}</div>
    </div>
  </div>
</template>

<style scoped>
.paper {
  --navy: #17426f;
  width: 794px;
  box-sizing: border-box;
  padding: 40px 48px 32px;
  min-height: 1120px;
  background: #fff;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
.head { display: flex; justify-content: space-between; align-items: flex-start; position: relative; }
.brand { display: flex; align-items: center; gap: 26px; }
.logo { width: 76px; height: auto; }
.brand-name { font-size: 30px; font-weight: 700; color: var(--navy); }
.stamp-wrap { position: absolute; right: 0; top: 78px; text-align: right; }
.title { font-size: 42px; color: var(--navy); margin-top: 10px; }
.stamp {
  display: inline-block; padding: 3px 14px; border: 3px solid; border-radius: 6px;
  font-size: 20px; font-weight: 700; letter-spacing: 2px; transform: rotate(-6deg);
}
.stamp.paid { color: #1a7f4b; }
.stamp.unpaid { color: #c62828; }
.paid-date { font-size: 11px; color: #1a7f4b; margin-top: 6px; }
.contact { font-weight: 700; line-height: 1.55; margin-top: 4px; }

.meta { display: flex; justify-content: space-between; margin-top: 26px; }
.meta-left { width: 49%; }
.meta-right { width: 49%; }
.bar { background: var(--navy); color: #fff; font-weight: 700; padding: 4px 8px; }
.val { padding: 4px 8px; }
.bold { font-weight: 700; }
.meta-row { display: flex; }
.meta-row .c1 { width: 45%; }
.meta-row .c2 { width: 55%; }

.items { width: 100%; border-collapse: collapse; margin-top: 24px; }
.items th { background: var(--navy); color: #fff; padding: 6px 8px; font-size: 12px; }
.items td { border: 1px dotted #000; padding: 4px 8px; height: 17px; }
.items .l { text-align: left; }
.items .c { text-align: center; }
.items .r { text-align: right; }
.items .qty { width: 8%; }
.items .price { width: 22%; }
.items .amt { width: 30%; }

.foot { display: flex; margin-top: 4px; }
.foot-left { width: 48%; padding-top: 6px; }
.thanks { color: var(--navy); font-weight: 700; font-style: italic; text-align: center; margin-bottom: 8px; width: 60%; }
.pay { padding: 3px 8px; }
.foot-right { width: 52%; }
.line { display: flex; justify-content: space-between; padding: 6px 8px 6px 14px; }
.total {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--navy); color: #fff; font-weight: 700; font-size: 20px; padding: 6px 10px 6px 18px; margin-top: 4px;
}
.closing { text-align: center; margin-top: 28px; line-height: 1.9; }
</style>
