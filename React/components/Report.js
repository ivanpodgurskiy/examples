import React, { Component, PropTypes } from 'react';
import { HistoryTable, FutureTable, PatientsTable, Overview, Fit, Extra } from 'components';
import { Tabs, Tab } from 'material-ui/Tabs';
import { getAge } from '../../utils/time.js';
import { connect } from 'react-redux';
import { load as loadCalculation } from 'redux/modules/calculation';
import { decemicalTimeFormat } from '../../utils/time';
import { FormattedDate, FormattedTime } from 'react-intl';
import RaisedButton from 'material-ui/RaisedButton';

@connect(
  null,
  { loadCalculation }
)
export default class Report extends Component {
  static propTypes = {
    data: PropTypes.object,
    patient: PropTypes.object,
    handleCalculation: PropTypes.func,
    loadCalculation: PropTypes.func,
    reviseClickHandle: PropTypes.func
  };

  state = {
    showExtra: false,
    mmoptProgress: 100,
    extraSrc: {},
    currentTab: 1,
    currentTable: 1,
    yLab: '',
    idxData: [],
    xData: [],
    mmopt: [],
    linesSrc: [],
    terminator: null,
    allDoseDTS: [],
    observations: [],
    targets: [],
    meanData: [],
    summary: [],
    aucSummary: [],
    needDrawFit: false,
    meanPercentBias: null,
    meanPercentImprecision: null,
    lastDose: null,
    lastConcentration: null
  };

  componentWillMount() {
    if (this.props.data && this.props.data.status === 'inprogress') {
      setTimeout(() => this.props.loadCalculation(this.props.data.id), 5000);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data && nextProps.data.status === 'inprogress') {
      setTimeout(() => this.props.loadCalculation(this.props.data.id), 5000);
    }
    this.prepareData(nextProps.data);
  }

  onChangeTableHandle = (value) => {
    this.setState({
      currentTable: value,
    });
  }

  onChangeHandle = (value) => {
    this.setState({
      currentTab: value,
    });
  }

  getCov = (covProps) => {
    const cov = { ...covProps };
    let crlcIndex = null;
    let sexIndex = null;
    let maleIndex = null;
    if (cov.covnames && cov.covnames) {
      (cov.covnames).forEach((name, index) => {
        if (name.toLowerCase() === 'crcl') {
          crlcIndex = index;
        }
        if (name.toLowerCase() === 'sex') {
          sexIndex = index;
        }
        if (name.toLowerCase() === 'male') {
          maleIndex = index;
        }
      });
    }

    if (crlcIndex) {
      cov.covnames.splice(crlcIndex, 1);
      cov.covlabels.splice(crlcIndex, 1);
      cov.covunits.splice(crlcIndex, 1);
      cov.ncov = cov.covnames.length;
    }
    if (sexIndex) {
      cov.covnames.splice(sexIndex, 1);
      cov.covlabels.splice(sexIndex, 1);
      cov.covunits.splice(sexIndex, 1);
      cov.ncov = cov.covnames.length;
    }
    if (maleIndex) {
      cov.covnames.splice(maleIndex, 1);
      cov.covlabels.splice(maleIndex, 1);
      cov.covunits.splice(maleIndex, 1);
      cov.ncov = cov.covnames.length;
    }
    return cov;
  };

  getFutureBestDoses = () => {
    const bestDoses = [];
    this.state.allDoseDTS.forEach((el) => {
      if (el.src === 'f') {
        bestDoses.push({
          x: el.x,
          value: el.value,
          unit: el.unit
        });
      }
    });
    return bestDoses;
  };

  getSummary = () => {
    const summary = [];
    this.state.summary.forEach((el) => {
      if (el.src === 'f') {
        const datetime = new Date((this.props.data.created * 1000) + (el.time * 60 * 60 * 1000));
        summary.push({
          time: el.time,
          datetime,
          measured: el.measured,
          unit: el.unit
        });
      }
    });
    return summary;
  };

  prepareData = (data) => {
    if (!data || data.status !== 'completed') {
      return data;
    }
    const drugIdx = 0; // ? numEq
    const probCut = 0.01;
    const drug = data.meta.drugs[drugIdx];
    const cAssay = data.meta.outputs[drugIdx].coeff;
    const cnt = data.result.simulatedObservedValues.length;
    const len = data.result.simulatedObservedValues[0].outputs[drugIdx].data.length;
    const milsPerHour = 60 * 60 * 1000;
    const past = data.request.past;
    const future = data.request.future;
    let startUnixTimestamp = (data.request.basetime ? data.request.basetime : data.created) * 1000;
    let shiftBaseDate = 0;
    if (data.request.nextdose > 0) shiftBaseDate = data.request.nextdose;
    else if (past && past.length > 0) shiftBaseDate = past[past.length - 1].time;

    if (shiftBaseDate > 0) {
      startUnixTimestamp -= shiftBaseDate * milsPerHour;
    }

    let nextDose = 0;
    let roundNext = 0;

    const okPts = [];
    const parvaluesOK = [];
    const _sdata = [];

    const yLab = `${drug.name} Concentration (${drug.concUnits})`;

    const xData = [];
    const meanData = [];
    for (let i = 0; i < len; i++) {
      const dtSrc = data.result.simulatedObservedValues[0].outputs[drugIdx].data[i][0];
      xData.push(new Date(startUnixTimestamp + (dtSrc * milsPerHour)));
      meanData.push({
        time: dtSrc,
        roundedTime: dtSrc.toFixed(3),
        mean1: 0,
        mean2: 0
      });
    }

    const probSource = [];
    let errCnt = 1000;
    let idx = 0;
    while (probSource.length === 0) {
      errCnt--;
      if (errCnt < 0) {
        console.log('ERROR in simulatedObservedValues');
        return;
      }

      const condition = (probCut + idx) / 100;
      for (let i = 0; i < cnt; i++) {
        if (data.result.simulatedObservedValues[i].associatedProb > condition) {
          okPts.push(i);
          _sdata.push(data.result.simulatedObservedValues[i]);
          probSource.push(data.result.simulatedObservedValues[i]);
          parvaluesOK.push(data.result.density.grid[i]);
        }
      }
      idx++;
    }

    let needDrawFit = false;
    let lastDose = null;
    if (past) {
      needDrawFit = true;
      nextDose = data.request.nextdose > 0 ? data.request.nextdose : past[past.length - 1].time;
      roundNext = nextDose.toFixed(3);

      for (let i = past.length - 1; i >= 0; i--) {
        const item = past[i];
        if (lastDose) {
          break;
        }
        if (item.eventID === 1) {
          lastDose = {
            date: new Date(startUnixTimestamp + (item.time * milsPerHour)),
            dose: item.dose,
            unit: drug.doseUnits
          };
        }
      }
    }

    let nextAUC = 0;
    const linesSrc = [];
    const idxData = [];
    for (let i = 0; i < probSource.length; i++) {
      idxData.push(i);
      const tmp = [];
      const item = probSource[i];
      for (let j = 0; j < len; j++) {
        tmp.push({ y: item.outputs[drugIdx].data[j][1], x: xData[j] });
        meanData[j].mean1 += item.associatedProb * item.outputs[drugIdx].data[j][1];
        meanData[j].mean2 += item.associatedProb * item.outputs[drugIdx].data[j][2];
        if (!meanData[j].source) {
          meanData[j].source = [];
        }
        meanData[j].source.push({
          prob: item.associatedProb,
          mean1: item.outputs[drugIdx].data[j][1],
          mean2: item.outputs[drugIdx].data[j][2]
        });

        if (meanData[j].roundedTime === roundNext) {
          nextAUC += item.associatedProb * item.outputs[drugIdx].data[j][2];
        }
      }
      linesSrc.push({ data: tmp, prob: probSource[i].associatedProb });
    }

    linesSrc.sort((a, b) => (
      parseFloat(b.prob) - parseFloat(a.prob)
    ));

    let terminator = null;
    let lastConcentration = null;
    const allDoseDTS = [];
    const observations = [];
    const aucSummary = [];
    let summary = [];
    if (past) {
      terminator = new Date(startUnixTimestamp + (nextDose * milsPerHour));
      let observationsIdx = 0;
      for (let i = 0; i < past.length; i++) {
        const item = past[i];
        const xDate = new Date(startUnixTimestamp + (item.time * milsPerHour));
        if (item.eventID === 1) {
          allDoseDTS.push({
            x: xDate,
            text: `${item.dose} ${drug.doseUnits}`,
            value: item.dose,
            unit: drug.doseUnits,
            src: 'p'
          });
          aucSummary.push({
            x: xDate,
            hours: item.time,
            roundedHours: item.time.toFixed(3),
            dose: item.dose,
            auc: 0,
            total: 0,
            src: 'p',
            type: 'Past Dose'
          });
        } else if (item.eventID === 0) {
          observations.push({
            x: xDate,
            y: item.out,
            idx: observationsIdx,
            measure: drug.doseUnits
          });
          observationsIdx++;

          summary.push({
            time: item.time,
            roundedTime: item.time.toFixed(3),
            src: 'p',
            type: item.out ? 'Measured' : 'Missing',
            measured: item.out,
            predicted: 0,
            unit: null
          });
        }
      }

      if (summary.length > 0) {
        for (let i = summary.length - 1; i >= 0; i--) {
          const item = summary[i];
          if (lastConcentration) {
            break;
          }
          if (item.type === 'Measured') {
            lastConcentration = {
              date: new Date(startUnixTimestamp + (item.time * milsPerHour)),
              measured: item.measured,
              unit: drug.concUnits
            };
          }
        }
      } else {
        lastConcentration = { date: null, measured: null, unit: null };
      }
    }

    if (data.request.optimize || data.request.simonly) {
      if (data.result.optimalDoses) {
        for (let i = 0; i < data.result.optimalDoses.length; i++) {
          const item = data.result.optimalDoses[i];

          let totalDose = data.request.dose;
          if (item.totalDose) {
            totalDose = item.totalDose < 100 ? item.totalDose.toFixed(2) : item.totalDose.toFixed(1);
          }

          const timeSrc = item.time + nextDose;
          const xDate = new Date(startUnixTimestamp + (timeSrc * milsPerHour));
          allDoseDTS.push({
            x: xDate,
            text: `${totalDose} ${drug.doseUnits}`,
            value: totalDose,
            unit: drug.doseUnits,
            src: 'f'
          });

          aucSummary.push({
            x: xDate,
            hours: timeSrc,
            roundedHours: timeSrc.toFixed(3),
            dose: totalDose,
            auc: 0,
            total: 0,
            src: 'f',
            type: 'Future Dose'
          });
        }
      }
    } else if (future) {
      for (let i = 0; i < future.length; i++) {
        const item = future[i];
        if (item.eventID === 1) {
          const timeSrc = item.time + nextDose;
          const xDate = new Date(startUnixTimestamp + (timeSrc * milsPerHour));
          const doseSrc = item.dose ? item.dose : data.request.dose;

          allDoseDTS.push({
            x: xDate,
            text: `${doseSrc} ${drug.doseUnits}`,
            value: doseSrc,
            unit: drug.doseUnits,
            src: 'f'
          });

          aucSummary.push({
            x: xDate,
            hours: timeSrc,
            roundedHours: timeSrc.toFixed(3),
            dose: doseSrc,
            auc: 0,
            total: 0,
            src: 'f',
            type: 'Future Dose'
          });
        }
      }
    }

    const targets = [];
    if (data.request.auc === false) {
      if (future) {
        for (let i = 0; i < future.length; i++) {
          const item = future[i];
          if (item.eventID === 0) {
            targets.push({
              x: new Date(startUnixTimestamp + ((item.time + nextDose) * milsPerHour)),
              target: item.out,
              text: `${(item.out < 100 ? item.out.toFixed(2) : item.out.toFixed(1))} ${drug.doseUnits}`,
              idx: targets.length
            });
          }
        }
      }
    }

    if (future) {
      for (let i = 0; i < future.length; i++) {
        const item = future[i];
        const timeSrc = item.time + nextDose;
        if (item.eventID === 0) {
          summary.push({
            time: timeSrc,
            roundedTime: timeSrc.toFixed(3),
            src: 'f',
            type: data.request.auc === true ? 'Target AUC' : 'Target',
            measured: item.out,
            predicted: 0,
            details: [],
            unit: data.request.auc === true ? drug.aucUnits : drug.concUnits,
          });
        }
      }
    }

    if (summary.length > 0) {
      aucSummary.push({
        x: new Date(startUnixTimestamp + (summary[summary.length - 1].time * milsPerHour)),
        hours: summary[summary.length - 1].time,
        roundedHours: summary[summary.length - 1].roundedTime,
        dose: 'NA',
        auc: 0,
        total: 0,
        src: 'end',
        type: 'Final Target Time'
      });
    }

    for (let i = 0; i < summary.length; i++) {
      const item = summary[i];
      let idxs = 0;
      let pred = 0;
      let details = [];
      while (idxs < meanData.length) {
        if (meanData[idxs].roundedTime === item.roundedTime) {
          if (!past) {
            if (data.request.auc === true) {
              pred = meanData[idxs].mean2;
              details = meanData[idxs].source.map((element) => ({
                probability: element.prob,
                concentration: element.mean2 }));
            } else {
              pred = meanData[idxs].mean1;
              details = meanData[idxs].source.map((element) => ({
                probability: element.prob,
                concentration: element.mean1 }));
            }
          } else if (past) {
            if (data.request.auc === true) {
              if (item.src === 'p') {
                pred = meanData[idxs].mean1;
                details = meanData[idxs].source.map((element) => ({
                  probability: element.prob,
                  concentration: element.mean1 }));
              } else {
                pred = meanData[idxs].mean2 - nextAUC;
                details = meanData[idxs].source.map((element) => ({
                  probability: element.prob,
                  concentration: element.mean2 - nextAUC }));
              }
            } else {
              pred = meanData[idxs].mean1;
              details = meanData[idxs].source.map((element) => ({
                probability: element.prob,
                concentration: element.mean1 }));
            }
          }
          break;
        }
        idxs++;
      }
      item.predicted = pred;
      item.details = details;
    }

    for (let i = 0; i < aucSummary.length; i++) {
      const item = aucSummary[i];
      let idxs = 0;
      while (idxs < meanData.length) {
        if (meanData[idxs].roundedTime === item.roundedHours) {
          item.total = meanData[idxs].mean2;
          if (i > 0) item.auc = item.total - aucSummary[i - 1].total;
          break;
        }
        idxs++;
      }
    }

    let predType = 'Measured';
    if (data.request.simonly === true) {
      predType = 'Target';

      const tmp = [];
      for (let i = 0; i < summary.length; i++) {
        if (summary[i].measured !== null) {
          tmp.push(summary[i]);
        }
      }
      summary = tmp;
    }

    let meanPercentBias = null;
    let meanPercentImprecision = null;
    if (meanPercentBias && meanPercentImprecision) {
      console.log('es-lint');
    }
    if (!past && !data.request.simonly) {
      meanPercentBias = null;
      meanPercentImprecision = null;
    } else {
      const c0 = data.request.errpoly[0];
      const c1 = data.request.errpoly[1];
      const c2 = data.request.errpoly[2];
      const c3 = data.request.errpoly[3];

      let obsSDSum = 0;
      let pwdSum = 0;
      let pwdsSum = 0;

      for (let i = 0; i < summary.length; i++) {
        if (summary[i].type === predType) {
          const measured = summary[i].measured;
          const predicted = summary[i].predicted;
          const obsSD = c0 + (c1 * measured) + (c2 * measured * measured) + (c3 * measured * measured * measured);
          const obsSD2 = obsSD * obsSD;
          const delta = predicted - measured;
          const pwd = (delta / measured) / obsSD2;
          const pwds = ((delta * delta) / (measured * measured)) / obsSD2;

          obsSDSum += 1 / obsSD2;
          pwdSum += pwd;
          pwdsSum += pwds;
        }
      }

      if (obsSDSum > 0) {
        const mwppe = pwdSum / obsSDSum;
        const mwsppe = pwdsSum / obsSDSum;
        const bamwsppe = mwsppe - (mwppe * mwppe);
        meanPercentBias = (100 * mwppe).toFixed(2);
        meanPercentImprecision = (100 * bamwsppe).toFixed(2);
      } else {
        meanPercentBias = null;
        meanPercentImprecision = null;
      }
    }

    if (data.request.mmopt) {
      console.log(`start mmopt calculation ${data.request.mmopt.nSam}`);
      this.bDmmopt(
        _sdata,
        parvaluesOK,
        cAssay,
        data.request.mmopt.nSam,
        nextDose,
        data.request.idelta,
        drugIdx + 1,
        data.request.mmopt.target,
        data.request.mmopt.start,
        data.request.mmopt.end,
        x => {
          const progress = x * 100;
          // console.log(`${progress.toFixed(0)}%`);
          if (this.state.mmoptProgress < progress) {
            this.setState({ mmoptProgress: progress });
          }
        },
        f => {
          if (!f.sampleTime || f.sampleTime.length === 0) return;

          const _mmoptData = [];
          for (let i = 0; i < f.sampleTime.length; i++) {
            _mmoptData.push(new Date(startUnixTimestamp + (f.sampleTime[i] * milsPerHour)));
          }
          this.setState({ mmopt: _mmoptData });
        });
    }

    this.setState({
      mmoptProgress: !data.request.mmopt ? 100 : 0,
      yLab,
      idxData,
      xData,
      linesSrc,
      terminator,
      allDoseDTS,
      observations,
      targets,
      meanData,
      summary,
      aucSummary,
      needDrawFit,
      meanPercentBias,
      meanPercentImprecision,
      lastDose,
      lastConcentration
    });
    // this.setState({ yLab });
    // this.setState({ idxData });
    // this.setState({ xData });
    // this.setState({ linesSrc });
    // this.setState({ terminator });
    // this.setState({ allDoseDTS });
    // this.setState({ observations });
    // this.setState({ targets });
    // this.setState({ meanData });
    // this.setState({ summary });
    // this.setState({ aucSummary });
    // this.setState({ needDrawFit });
    // this.setState({ meanPercentBias });
    // this.setState({ meanPercentImprecision });
    // this.setState({ lastDose });
    // this.setState({ lastConcentration });
  };

  clickTarget = (item) => {
    this.setState({
      showExtra: true,
      extraSrc: this.state.summary[item.idx + this.state.observations.length]
    });
  };

  clickObservation = (item) => {
    this.setState({
      showExtra: true,
      extraSrc: this.state.summary[item.idx]
    });
  };

  clickPlot = () => {
    this.setState({
      showExtra: false,
      extraSrc: {}
    });
  };

  transpose = (m) => m[0].map((x, i) => m.map(k => k[i]));

  matrix = (fill, nrow, ncol) => Array.from({ length: nrow }, () => Array.from({ length: ncol }, () => fill));

  diag = (fill, matrix) => {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix.length; j++) {
        if (i === j) matrix[i][j] = fill;
      }
    }
    return matrix;
  };

  frobeniusNorm = m => {
    let summ = 0;
    for (let i = 0; i < m.length; i++) {
      for (let j = 0; j < m[i].length; j++) {
        summ += Math.pow(m[i][j], 2);
      }
    }
    return Math.sqrt(summ);
  };

  multiply = (a, b) => {
    const aNumRows = a.length;
    const aNumCols = a[0].length;
    // const bNumRows = b.length;
    const bNumCols = b[0].length;
    const m = new Array(aNumRows);  // initialize array of rows

    for (let r = 0; r < aNumRows; ++r) {
      m[r] = new Array(bNumCols); // initialize the current row
      for (let c = 0; c < bNumCols; ++c) {
        m[r][c] = 0;             // initialize the current cell
        for (let i = 0; i < aNumCols; ++i) {
          m[r][c] += a[r][i] * b[i][c];
        }
      }
    }
    return m;
  };

  directMul = (m1, m2) => {
    const result = this.matrix(0, m1.length, m1[0].length);
    for (let i = 0; i < m1.length; i++) {
      for (let j = 0; j < m1[i].length; j++) {
        result[i][j] = m1[i][j] * m2[i][j];
      }
    }
    return result;
  };

  directAdd = (m1, m2) => {
    const result = this.matrix(0, m1.length, m1[0].length);
    for (let i = 0; i < m1.length; i++) {
      for (let j = 0; j < m1[i].length; j++) {
        result[i][j] = m1[i][j] + m2[i][j];
      }
    }
    return result;
  };

  directSub = (m1, m2) => {
    const result = this.matrix(0, m1.length, m1[0].length);
    for (let i = 0; i < m1.length; i++) {
      for (let j = 0; j < m1[i].length; j++) {
        result[i][j] = m1[i][j] - m2[i][j];
      }
    }
    return result;
  };

  directDiv = (m1, m2) => {
    const result = this.matrix(0, m1.length, m1[0].length);
    for (let i = 0; i < m1.length; i++) {
      for (let j = 0; j < m1[i].length; j++) {
        result[i][j] = m1[i][j] / m2[i][j];
      }
    }
    return result;
  };

  matrixApply = (m, f) => {
    for (let i = 0; i < m.length; i++) {
      for (let j = 0; j < m[i].length; j++) {
        m[i][j] = f(m[i][j]);
      }
    }
    return m;
  };

  cloneMatrix = m => m.map(arr => arr.slice());

  kallIjn = (Mu, c0, c1, c2, c3, nsubs, nout) => {
    // Make full K matri
    const Kall = []; // <-array(0,dim=c(nsubs,nsubs,nout));
    const skall = this.matrix(0, nout, 1); // to store norm as function of n=1:nout
    // fill Kall
    for (let i = 0; i < nout; i++) {
      const Kn = this.kmatIjn(Mu, i, c0, c1, c2, c3, nsubs, nout);
      skall[i][0] = this.frobeniusNorm(Kn); // Frobenious norm
      Kall.push(Kn);
    }
    return { Kall, skall };
  }

  kmatIjn = (Mu, n, c0, c1, c2, c3, nsubs) => {
    const youtN = []; // = cloneMatrix(Mu[n]);
    for (let i = 0; i < Mu[n].length; i++) {
      youtN.push([Mu[n][i]]);
    }
    const Sig2 = [];

    for (let i = 0; i < nsubs; i++) {
      const r1 = c1 * youtN[i];
      const r2 = c2 * Math.pow(youtN[i], 2);
      const r3 = c3 * Math.pow(youtN[i], 3);
      Sig2.push([Math.pow((c0 + r1 + r2 + r3), 2)]);
    }

    const oneRow = this.matrix(1, 1, nsubs);
    const oneCol = this.matrix(1, nsubs, 1);
    const sigPart1 = this.multiply(Sig2, oneRow);
    const sigPart2 = this.multiply(oneCol, this.transpose(Sig2));

    const Sig2plus = this.directAdd(sigPart1, sigPart2);
    const Sig2prod = this.directMul(sigPart1, sigPart2);

    const munPart1 = this.multiply(youtN, oneRow);
    const munPart2 = this.multiply(oneCol, this.transpose(youtN));

    const munMinus = this.directMul(munPart1, munPart2);
    const part1 = this.directDiv(this.matrixApply(munMinus, x => Math.pow(x, 2) / 4), Sig2plus);
    const part2 = this.matrixApply(Sig2plus, x => Math.log(x / 2) / 2);
    const part3 = this.matrixApply(Sig2prod, x => Math.log(x) / 4);
    const Kijn = this.directSub(this.directAdd(part1, part2), part3);

    return Kijn;
  }

  cbarMake1 = (C) => {
    const nsubs = C.length;
    const Cbar = this.matrix(0, nsubs, nsubs);
    for (let i = 0; i < nsubs; i++) {
      for (let j = 0; j < nsubs; j++) {
        Cbar[i][j] = Math.max(C[i][j], C[j][i]); // Definition: cbar_ij=max(c_ij, c_ji)
      }
    }
    return Cbar;
  }

  perrorc2 = (pH5, pH5t, Kall, nvec, Cbar) => {
    const nsubs = Kall[0].length;
    const nsamp = nvec.length;
    let Kallsum = this.matrix(0, nsubs, nsubs);
    for (let n = 0; n < nsamp; n++) {
      Kallsum = this.directAdd(Kallsum, Kall[nvec[n]]);
    }

    const ExpKallsum = this.matrixApply(Kallsum, x => Math.exp(-x));
    const ExpKallsum0 = this.diag(0, ExpKallsum);
    return this.multiply(this.multiply(pH5t, this.directMul(ExpKallsum0, Cbar)), pH5)[0];
  }

  solutionAsync = (ctx) => {
    this.solutionCalc(ctx);
    this.solutionNext(ctx);
    if (ctx.fnProgress) ctx.fnProgress(ctx.n[0] / ctx.nout);
    if (ctx.n[0] < ctx.nout) setTimeout(() => this.solutionAsync(ctx), 1);
    else {
      if (ctx.fnProgress) ctx.fnProgress(ctx.n[0] / ctx.nout);
      this.solutionComplete(ctx);
    }
  }

  solutionComplete = (ctx) => {
    const optsamp = [];
    const brisk = [-1, -1, -1, -1];
    for (let i = 0; i < ctx.nopt.length; i++) {
      optsamp.push(ctx.time[ctx.nopt[i]]);
    }
    brisk[ctx.nopt.length - 1] = ctx.perror_min;
    ctx.fnComplete({ optsamp, brisk, optindex: ctx.nopt, Cbar: ctx.Cbar });
  }

  solutionNext = (ctx) => {
    let i = ctx.n.length - 1;
    for (; i > 0; i--) {
      ctx.n[i]++;
      if (ctx.n[i] < ctx.nout) break;
      ctx.n[i] = 0;
    }
    if (i === 0) ctx.n[0]++;

    for (let j = i + 1; j < ctx.n.length; j++) {
      ctx.n[j] = ctx.n[j - 1];
    }
  }

  solutionCalc = (ctx) => {
    const lastN = ctx.n.length > 0 ? ctx.n[ctx.n.length - 1] : 0;
    for (let n = lastN; n < ctx.nout; n++) {
      const nvec = ctx.n.slice();
      nvec.push(n);
      const perror = this.perrorc2(ctx.pH5, ctx.pH5t, ctx.Kall, nvec, ctx.Cbar);
      if (n === 0) {
        ctx.perror_min = perror;
        ctx.nopt = nvec;
      }
      if (perror < ctx.perror_min) {
        ctx.perror_min = perror;
        ctx.nopt = nvec;
      }
    }
  }

  wmmopt1 = (Mu, time, pH, cassay, nsamp, nsubs, nout, C, fnProgress, fnComplete) => {
    // -------------------------------
    // Extract needed quantities
    const c0 = cassay[0]; // additive noise
    const c1 = cassay[1];
    const c2 = cassay[2];
    const c3 = cassay[3];

    // BEGIN MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
    // FULL SCRIPT VERSION OF MMOPT ALGORITHM
    // -----------------------------------
    // Compute Kall
    const kallijn = this.kallIjn(Mu, c0, c1, c2, c3, nsubs, nout);
    // Compute Cbar matrix for control weighting overbound
    const Cbar = this.cbarMake1(C);
    const pH5 = [];
    for (let i = 0; i < pH.length; i++) {
      pH5.push([Math.sqrt(pH[i])]);
    }

    const pH5t = this.matrixApply(this.transpose(pH5), x => x / 2);

    const context = {
      nopt: [],
      time,
      perror_min: -1,
      Kall: kallijn.Kall,
      skall: kallijn.skall,
      Cbar,
      pH5,
      pH5t,
      fnProgress,
      fnComplete,
      nsamp,
      nout,
      n: []
    };

    // ------------------------------
    // SINGLE SAMPLE OPTIMIZATION
    if (nsamp === 1) {
      // `111111111111111111111111111111111111111111111111111111111111111
      // `111111111111111111111111111111111111111111111111111111111111111
      // ` 1-SAMPLE SEARCH: FULL COMBINATORIAL SEARCH
      // ` Perror1_stor=zeros(nout); # to save intermediary results
      // `
      setTimeout(() => {
        this.solutionCalc(context);
        if (context.fnProgress) context.fnProgress(1);
        this.solutionComplete(context);
      }, 1);
      return;
    }   // endif
    //  ------------------------------
    //  TWO SAMPLE OPTIMIZATION
    if (nsamp === 2) {
      // 222222222222222222222222222222222222222222222222222222222222222
      // 222222222222222222222222222222222222222222222222222222222222222
      // 222222222222222222222222222222222222222222222222222222222222222
      //  2-SAMPLE SEARCH: FULL COMBINATORIAL SEARCH
      //  Perror2_stor=zeros(nout,nout); # to save intermediary results
      //
      // context.n2 = 0;
      // setTimeout(wMmopt2Async(context), 1);
      // return;
      context.n = [0];
      setTimeout(() => this.solutionAsync(context), 1);
      return;
    }   //  endif
    //
    //  ------------------------------
    //  THREE SAMPLE OPTIMIZATION
    if (nsamp === 3) {
      // 333333333333333333333333333333333333333333333333333333333333333
      // 333333333333333333333333333333333333333333333333333333333333333
      // 333333333333333333333333333333333333333333333333333333333333333
      //  3-SAMPLE SEARCH: FULL COMBINATORIAL SEARCH
      //  Perror3_stor=zeros(nout,nout,nout); # to save intermediary results
      context.n = [0, 0];
      setTimeout(() => this.solutionAsync(context), 1);
      return;
    }   //  endif
    //
    //  ------------------------------
    //  FOUR SAMPLE OPTIMIZATION
    if (nsamp === 4) {
      // 444444444444444444444444444444444444444444444444444444444444444
      // 444444444444444444444444444444444444444444444444444444444444444
      //  4-SAMPLE SEARCH: FULL COMBINATORIAL SEARCH
      //  Careful: don't store anything or you will blow memory!!!!
      // Perror4_stor=zeros(nout,nout,nout,nout); # to save intermediary results
      // cat("\nComputing 4-sample design\n")
      // pb <- txtProgressBar(min = 0, max = nout, style = 3)
      context.n = [0, 0, 0];
      setTimeout(() => this.solutionAsync(context), 1);
      return;
    }   //  endif
  }

  bDmmopt = (sData, posterior, cAssay, nSamp, tNext, iDelta, outEq, weight, start, end, fnProgress, fnComplete) => {
    if (nSamp > 2) nSamp = 2;
    if (end <= 0) end = 9999;

    // const npoints = posterior.length;
    const allTime = [];
    const _len = sData[0].outputs[0].data.length;
    const _finish = tNext + end;
    const _begin = (tNext + start).toFixed(3);
    let _timeBreakIndex = 0;
    const time = [];
    let Mu = [];
    const pH = [];
    const auc = [];

    for (let i = 0; i < _len; i++) {
      const dt = sData[0].outputs[0].data[i][0];
      if (dt <= _finish) {
        allTime.push(dt);
        if (dt.toFixed(3) === _begin) {
          _timeBreakIndex = allTime.length - 1;
        }
      }
    }

    const _timeEndIndex = Math.floor(allTime.length - (0.4 * iDelta));
    for (let i = _timeBreakIndex; i <= _timeEndIndex; i++) {
      time.push(allTime[i]);
    }

    for (let i = 0; i < sData.length; i++) {
      const result = [];
      const item = sData[i];
      for (let j = 0; j < item.outputs.length; j++) {
        if (item.outputs[j].outputEq === outEq) {
          for (let k = 0; k < item.outputs[j].data.length; k++) {
            for (let n = 0; n < time.length; n++) {
              const _time = time[n].toFixed(3);
              if ((item.outputs[j].data[k][0]).toFixed(3) === _time) {
                result.push(item.outputs[j].data[k][1]);
                if (n === time.length - 1) {
                  auc.push(item.outputs[j].data[k][2]);
                }
              }
            }
          }
        }
      }
      Mu.push(result);
    }

    Mu = this.transpose(Mu);

    for (let i = 0; i < posterior.length; i++) {
      const line = posterior[i];
      pH.push(line[line.length - 1]);
    }

    const nsubs = Mu[0].length;
    const nout = Mu.length;

    const C = this.diag(0, this.matrix(1, nsubs, nsubs));
    if (weight === 'auc') {
      for (let i = 0; i < auc.length; i++) {
        for (let j = 0; j < auc.length; j++) {
          const val = Math.pow(auc[i] - auc[j], 2);
          C[i][j] = val;
          C[j][i] = val;
        }
      }
    }

    const mmopt1Cb = (mmopt1) => {
      const sampleTime = [];
      const bayesRisk = mmopt1.brisk[nSamp - 1];
      for (let i = 0; i < nSamp; i++) {
        sampleTime.push(mmopt1.optsamp[i]);
      }

      if (fnComplete) { fnComplete({ sampleTime, bayesRisk }); }
    };

    this.wmmopt1(Mu, time, pH, cAssay, nSamp, nsubs, nout, C, fnProgress, mmopt1Cb);
  }

  render() {
    const { data, patient, handleCalculation } = this.props;
    const css = require('./Report.scss');
    const styles = require('../../theme/material-ui.js');
    return (
      <div>
        { data && data.status === 'failed' &&
        <div className={css.stepBlock}>
          <div className="container">
            <div className="alert alert-danger text-center">
              This calculation was completed with <strong>FAILED</strong> status
            </div>
            <div className="alert alert-danger">
              <pre dangerouslySetInnerHTML={{ __html: data.description.split('\n').join('<br />') }} />
            </div>
          </div>
        </div>
        }
        { data && data.status === 'inprogress' &&
        <div className={css.stepBlock}>
          <div className="container">
            <div className="alert alert-info text-center">
              This calculation is in progress.
            </div>
          </div>
        </div>
        }
        {/* STEP 1 Patient Information */}
        {/* { data && data.drug &&
          <div className={`${css.stepBlock} ${css.step1Block}`}>
            <div className="container">
              <h2 className={css.stepBlockHeader}>Step 1: Medication & Indication</h2>
              <div className={css.stepBlockContent}>
                <div className="row">
                  <div className={`col-sm-6 ${css.medication}`}>
                    <div className={`${css.resultBox} ${css.medicationBox}`}>
                      <strong>{data.drug}</strong>
                      <small>Medication</small>
                    </div>
                  </div>
                  <div className={`col-sm-6 ${css.medication}`}>
                    <div className={`${css.resultBox} ${css.indicationBox}`}>
                      <strong>{data.indication}</strong>
                      <small>Indication</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } */}
        {/* STEP 2 Patient Information */}
        {/* { patient &&
        <div className={`${css.stepBlock} ${css.step2Block}`}>
          <div className="container-fluid">
            <h2 className={css.stepBlockHeader}>Step 2: Patient Information</h2>
            <div className={css.resultBox}>
              <strong>{patient.firstName} {patient.lastName}</strong>
              <small>
                <span>{getAge(patient.dob)}yr old </span>
                {patient.gender === 'M' ? 'Male' : 'Female'} |
                Med. Rec. # {patient.medicalRecord}
              </small>
            </div>
          </div>
        </div>
        } */}
        {data && data.drug && patient &&
          <div className={`${css.stepBlock} ${css.stepNewBlock}`}>
            <h2 className={css.stepBlockHeader}>Patient Information, Medication & Indication</h2>
            <div className="container-fluid">
              <ul>
                <li>
                  <span>Patient</span>
                  <strong>{patient.firstName} {patient.lastName},&nbsp;
                  {getAge(patient.dob)}yr old,&nbsp;
                  {patient.gender === 'M' ? 'Male' : 'Female'},&nbsp;
                  Med. Rec. # {patient.medicalRecord}</strong>
                </li>
                <li><span>Medication</span><strong>{data.drug}</strong></li>
                <li><span>Indication</span><strong>{data.indication}</strong></li>
              </ul>
            </div>
          </div>
        }
        {/* STEP 3 Treatment History */}
        <div className={`${css.stepBlock} ${css.stepTablesBlock}`}>
          <Tabs
            tabItemContainerStyle={styles.tabs.tabItemContainerStyle}
            contentContainerStyle={styles.tabs.contentContainerStyle}
            inkBarStyle={styles.tabs.inkBarStyle}>
            {data && data.hasPast &&
            <Tab
              label="Treatment History"
              onActive={() => {
                this.onChangeTableHandle(1);
              }}
              buttonStyle={this.state.currentTable === 1 ? {
                ...styles.tabs.tab.buttonStyle,
                ...styles.tabs.tab.buttonStyleActive
              } : styles.tabs.tab.buttonStyle}>
              <div className="container-fluid text-center">
                <h2 className={css.stepBlockHeader}>Treatment History</h2>
                {data && data.request.nextdose &&
                  <div className={css.resultBox}>
                    <strong>{decemicalTimeFormat(data.request.nextdose)}</strong>
                    <small>Next Dose Time</small>
                  </div>
                }

                <HistoryTable
                  isEditable={false}
                  cov={this.getCov(data.meta.cov)}
                  data={data.request.past}
                />
              </div>
            </Tab>
            }
            {data && data.request && data.request.future &&
            <Tab
              label="Treatment Plan"
              onActive={() => {
                this.onChangeTableHandle(2);
              }}
              buttonStyle={this.state.currentTable === 2 ? {
                ...styles.tabs.tab.buttonStyle,
                ...styles.tabs.tab.buttonStyleActive
              } : styles.tabs.tab.buttonStyle}>
              <div className="container-fluid">
                <h2 className={css.stepBlockHeader}>Treatment Plan</h2>
                <FutureTable
                  isEditable={false}
                  cov={this.getCov(data.meta.cov)}
                  data={data.request.future}
                />
              </div>
            </Tab>
            }
          </Tabs>
        </div>
        { data && data.id && data.status === 'completed' &&
        <div className={`${css.stepBlock} ${css.finalBlock}`}>
          <h1 className={css.drugTitle}>{data.drug}</h1>
          <Tabs
            tabItemContainerStyle={styles.tabs.tabItemContainerStyle}
            contentContainerStyle={styles.tabs.contentContainerStyle}
            inkBarStyle={styles.tabs.inkBarStyle}>
            <Tab
              label="Overview"
              onActive={() => {
                this.onChangeHandle(1);
              }}
              buttonStyle={this.state.currentTab === 1 ? {
                ...styles.tabs.tab.buttonStyle,
                ...styles.tabs.tab.buttonStyleActive
              } : styles.tabs.tab.buttonStyle}>
              <div className="container">
                <Overview
                  data={data}
                  preparedData={this.state}
                  showExtra={this.state.showExtra}
                  mmoptProgress={this.state.mmoptProgress}
                  clickTarget={this.clickTarget}
                  clickObservation={this.clickObservation}
                  clickPlot={this.clickPlot}
                />
                { this.state.showExtra &&
                  <Extra
                    data={data}
                    src={this.state.extraSrc}
                    preparedData={this.state}
                  />
                }
              </div>
            </Tab>
            <Tab
              label="Summary"
              onActive={() => {
                this.onChangeHandle(2);
              }}
              buttonStyle={this.state.currentTab === 2 ? {
                ...styles.tabs.tab.buttonStyle,
                backgroundColor: '#252525'
              } : styles.tabs.tab.buttonStyle}>
              <div className="container">
                <div className="row">
                  <div className={`col-sm-6 ${css.medication}`}>
                    <div className={`${css.resultBox} ${css.medicationBox}`}>
                      {!this.state.lastDose &&
                      <strong>None</strong>
                      }
                      {this.state.lastDose &&
                      <span>
                        <strong>{this.state.lastDose.dose} {this.state.lastDose.unit}</strong>
                        <small>
                          <FormattedDate value={this.state.lastDose.date} />&nbsp;
                          <FormattedTime value={this.state.lastDose.date} />
                        </small>
                      </span>
                      }
                      <small>Last Dose</small>
                    </div>
                  </div>
                  <div className={`col-sm-6 ${css.medication}`}>
                    <div className={`${css.resultBox} ${css.indicationBox}`}>
                      {!this.state.lastConcentration &&
                      <strong>None</strong>
                      }
                      {this.state.lastConcentration &&
                      <span>
                        <strong>{this.state.lastConcentration.measured} {this.state.lastConcentration.unit}</strong>
                        <small>
                          <FormattedDate value={this.state.lastConcentration.date} />&nbsp;
                          <FormattedTime value={this.state.lastConcentration.date} />
                        </small>
                      </span>
                      }
                      <small>Last Concentration</small>
                    </div>
                  </div>
                </div>
                <div className="row">
                  {this.state.allDoseDTS.length > 0 &&
                  <div className="col-lg-4">
                    <h2 className={css.stepBlockHeader}>Future BestDoses</h2>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Dose</th>
                          <th>Units</th>
                        </tr>
                      </thead>
                      {this.getFutureBestDoses().map((row, idx) => (
                        <tbody key={idx}>
                          <tr>
                            <td>{idx + 1}</td>
                            <td><FormattedDate value={row.x} /></td>
                            <td><FormattedTime value={row.x} /></td>
                            <td>{row.value}</td>
                            <td>{row.unit}</td>
                          </tr>
                        </tbody>
                      ))}
                    </table>
                  </div>
                  }
                  {this.state.summary.length > 0 &&
                  <div className="col-lg-4">
                    <h2 className={css.stepBlockHeader}>Requested Target(s)</h2>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Target</th>
                          <th>Units</th>
                        </tr>
                      </thead>
                      {this.getSummary().map((row, idx) => (
                        <tbody key={idx}>
                          <tr>
                            <td>{idx + 1}</td>
                            <td><FormattedDate value={new Date(row.datetime)} /></td>
                            <td><FormattedTime value={new Date(row.datetime)} /></td>
                            <td>{row.measured}</td>
                            <td>{row.unit}</td>
                          </tr>
                        </tbody>
                      ))}
                    </table>
                  </div>
                  }
                  {this.state.mmopt && this.state.mmopt.length > 0 &&
                  <div className="col-lg-4">
                    <h2 className={css.stepBlockHeader}>Future Optimal Sample Time(s)</h2>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      {this.state.mmopt.map((item, idx) => (
                        <tbody key={idx}>
                          <tr>
                            <td>{idx + 1}</td>
                            <td><FormattedDate value={item} /></td>
                            <td><FormattedTime value={item} /></td>
                          </tr>
                        </tbody>
                      ))}
                    </table>
                  </div>
                  }
                </div>
              </div>
            </Tab>
            {this.state.needDrawFit &&
            <Tab
              label="Fit Quality"
              onActive={() => {
                this.onChangeHandle(3);
              }}
              buttonStyle={this.state.currentTab === 3 ? {
                ...styles.tabs.tab.buttonStyle,
                ...styles.tabs.tab.buttonStyleActive
              } : styles.tabs.tab.buttonStyle}>
              <div>
                <Fit
                  data={data}
                  preparedData={this.state}
                />
              </div>
            </Tab>
            }
            <Tab
              label="AUC"
              onActive={() => {
                this.onChangeHandle(4);
              }}
              buttonStyle={this.state.currentTab === 4 ? {
                ...styles.tabs.tab.buttonStyle,
                backgroundColor: '#252525'
              } : styles.tabs.tab.buttonStyle}>
              <div className="container">
                <div className="row">
                  {this.state.aucSummary.length > 0 &&
                  <div className="col-lg-8 col-lg-offset-2">
                    <h2 className={css.stepBlockHeader}>Inter-dose and Cumulative AUC</h2>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Hours</th>
                          <th>Dose</th>
                          <th>AUC</th>
                          <th>Total</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      {this.state.aucSummary.map((row, idx) => (
                        <tbody key={idx}>
                          <tr>
                            <td>{idx + 1}</td>
                            <td><FormattedDate value={row.x} /></td>
                            <td><FormattedTime value={row.x} /></td>
                            <td>{row.hours.toFixed(2)}</td>
                            <td>{row.dose}</td>
                            <td>{row.auc.toFixed(2)}</td>
                            <td>{row.total.toFixed(2)}</td>
                            <td>{row.type}</td>
                          </tr>
                        </tbody>
                      ))}
                    </table>
                  </div>
                  }
                </div>
              </div>
            </Tab>
            <Tab
              label="Previous Reports"
              onActive={() => {
                this.onChangeHandle(5);
              }}
              buttonStyle={this.state.currentTab === 5 ? {
                ...styles.tabs.tab.buttonStyle,
                ...styles.tabs.tab.buttonStyleActive
              } : styles.tabs.tab.buttonStyle}>
              <div className="container-fluid">
                { patient &&
                <PatientsTable
                  onPatientSelected={() => {
                  }}
                  searchHandle={() => {
                  }}
                  calculationHandle={handleCalculation}
                  patients={{
                    loading: false,
                    loaded: false,
                    data: {
                      data: [patient]
                    }
                  }} />
                }
              </div>
            </Tab>
          </Tabs>
        </div>
        }
        { data && data.id && data.status === 'completed' &&
          <div className="text-center">
            <RaisedButton
              label="Revise"
              className={css.mobileButton}
              onClick={() => this.props.reviseClickHandle(data.id, patient.id)}
              buttonStyle={{
                backgroundColor: '#f8a62a',
                border: '4px solid #d08f27',
                height: '40px',
                fontSize: '20px',
                borderRadius: '0'
              }}
              labelStyle={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: 300,
                textTransform: 'none',
                whiteSpace: 'nowrap'
              }}
              overlayStyle={{
                height: '40px',
                lineHeight: '30px'
              }}
            />
          </div>
        }
      </div>
    );
  }
}
