<template lang="html">
  <div class="ui-lunar">
    <c-col v-for="(column, index) in columns">
      <c-picker v-if="column.type === 'picker'"
        :class="column.class"
        :index="column.index"
        :size="7"
        transition
        @change="column.mutate">
        <p
          v-for="(item, i) in column.items"
          :class="['column-item', {'column-item-active': column.index === i}]">{{item.label || item}}</p>
      </c-picker>
    </c-col>
  </div>
</template>

<script>
import CPicker from 'components/c-picker'
import CCol from 'components/c-col'
import datetime from 'nd-datetime'
import solarLunar from 'solarlunar'

function date2Obj (number) {
  const moment = datetime(number)
  /* eslint-disable */
  return solarLunar.solar2lunar(moment.yyyy(), moment.M(), moment.d())
  /* eslint-disable */
}

function getArrIndex (items, str, key) {
  let index = -1
  items.some((item, i) => {
    if ((key ? item[key] : item) === str) {
      index = i
      return true
    }
    return false
  })
  return index
}

const YEARS = []
for (let i = 1900; i <= 2099; i++) {
  YEARS.push({
    label: i + '年',
    value: i
  })
}
const MONTHS = solarLunar.nStr3.map((mon, index) => {
  return {
    label: mon + '月',
    value: index + 1
  }
})
const DAYSCN = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
const DAYS = DAYSCN.map((day, index) => ({
  label: day,
  value: index + 1
}))

export default {
  name: 'lunar',
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    const {
      value = Date.now(),
      constraint = {}
    } = this.data
    const {
      max,
      min
    } = constraint
    const minDate = datetime(min || '1900-1-31').toNumber() // 公历1900-1-31，是农历1900年正月初一
    const maxDate = datetime(max || Date.now()).toNumber()
    let valueObj
    const tempValue = datetime(value).toNumber()
    if (tempValue < minDate) {
      valueObj = date2Obj(minDate)
    } else if (tempValue > maxDate) {
      valueObj = date2Obj(maxDate)
    } else {
      valueObj = date2Obj(value)
    }

    return {
      maxObj: date2Obj(maxDate),
      minObj: date2Obj(minDate),
      year: valueObj.lYear,
      month: valueObj.lMonth,
      monthCn: valueObj.monthCn,
      day: valueObj.lDay,
      dayCn: valueObj.dayCn
    }
  },
  methods: {
    getValue () {
      const valueObj = solarLunar.lunar2solar(this.year, this.month, this.day, this.monthCn.indexOf('闰') !== -1)
      return {
        value: datetime(`${valueObj.cYear}-${valueObj.cMonth}-${valueObj.cDay}`).toNumber(),
        valueCn: `${+this.month < 10 ? '0' + +this.month : this.month}-${+this.day < 10 ? '0' + +this.day : this.day}`
      }
    },
    getYear () {
      const items = YEARS.slice(this.minObj.lYear - 1900, this.maxObj.lYear - 1899)
      const index = getArrIndex(items, this.year, 'value')
      if (index === -1) {
        this.year = items[0].value
      }

      return {
        class: 'c-lunar-years',
        type: 'picker',
        index: index > -1 ? index : 0,
        items: items,
        mutate: i => {
          this.year = +items[i].value
        }
      }
    },
    getMonth () {
      const leapMonth = solarLunar.leapMonth(this.year)
      let items = MONTHS.slice(0)
      if (leapMonth) {
        items.splice(leapMonth, 0, {
          label: `闰${solarLunar.nStr3[leapMonth-1]}月`,
          value: leapMonth
        })
      }
      // 已达到最大年份
      if (this.maxObj.lYear === this.year) {
        items =  items.slice(0, getArrIndex(items, this.maxObj.monthCn, 'label') + 1)
      }
      // 已达到最小年份
      if (this.minObj.lYear === this.year) {
        items =  items.slice(getArrIndex(items, this.minObj.monthCn, 'label'))
      }

      const index = getArrIndex(items, this.monthCn, 'label')
      if (index === -1) {
        this.month = +items[0].value
        this.monthCn = items[0].label
      }

      return {
        class: 'c-lunar-months',
        type: 'picker',
        index: index > -1 ? index : 0,
        items,
        mutate: i => {
          this.month = +items[i].value
          this.monthCn = items[i].label
        }
      }
    },
    getDay () {
      let days = 29
      if (this.monthCn.indexOf('闰') === -1) {
        days = solarLunar.monthDays(this.year, this.month)
      } else {
        days = solarLunar.leapDays(this.year, this.month)
      }
      let items
      // 已达到最大年份和月份
      if (this.maxObj.lYear === this.year && this.maxObj.monthCn === this.monthCn) {
        items = DAYS.slice(0, this.maxObj.lDay)
      // 已达到最小年份和月份
      } else if (this.minObj.lYear === this.year && this.minObj.monthCn === this.monthCn) {
        items = DAYS.slice(this.minObj.lDay - 1, days)
      } else {
        items = DAYS.slice(0, days)
      }

      const index = getArrIndex(items, this.day, 'value')
      if (index === -1) {
        this.day = +items[0].value
        this.dayCn = items[0].label
      }
      return {
        class: 'c-lunar-days',
        type: 'picker',
        index: index > -1 ? index : 0,
        items,
        mutate: i => {
          this.day = +items[i].value
          this.dayCn = items[i].label
        }
      }
    }
  },
  computed: {
    columns () {
      return [this.getYear(), this.getMonth(), this.getDay()]
    }
  },
  components: {
    CPicker,
    CCol
  }
}
</script>

<style lang="postcss">
  .ui-lunar {
    display: flex;
    width: 100%;
    padding: dpr(42px) 0;
    border-top: dpr(2px) solid var(--color9);
    background-color: var(--color7);

    & p.column-item {
      font-size: dpr(36px);
    }
  }
</style>
