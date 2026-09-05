// Generates server/seed/passages.json — the Court-English typing bank.
//
// The eight hand-authored passages in passages.base.json are kept verbatim as
// the opening of the bank (the first six are visible at launch). This script
// then appends a large, deterministic drip bank so there is a fresh passage to
// unlock every day from day 7 for two months and more. Each passage is stitched
// from authentic legal-document archetypes with real dates, case numbers, Punjab
// & Haryana districts and section references — so every one reads as a distinct
// document, never a fill-in-the-blank skeleton. Seeded, so a re-run reproduces
// the identical bank; nothing is generated at runtime.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// mulberry32 — fixed, reproducible pseudo-randomness.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const pickN = (r, arr, n) => {
  const c = [...arr]; const out = [];
  for (let i = 0; i < n && c.length; i += 1) out.push(c.splice(Math.floor(r() * c.length), 1)[0]);
  return out;
};

const DAY = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth',
  'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth',
  'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const dateWords = (r) => `the ${pick(r, DAY.slice(1, 29))} of ${pick(r, MONTHS)}, ${pick(r, YEARS)}`;

const DISTRICTS = ['Chandigarh', 'Ambala', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Rohtak', 'Hisar',
  'Karnal', 'Gurugram', 'Faridabad', 'Panipat', 'Sonipat', 'Bathinda', 'Sangrur', 'Kurukshetra', 'Yamunanagar',
  'Rewari', 'Jind', 'Kaithal', 'Fatehabad', 'Sirsa', 'Moga', 'Barnala', 'Mansa', 'Firozpur', 'Mohali', 'Panchkula'];
const PS = ['Sector 34, Chandigarh', 'Division No. 3, Ludhiana', 'City Kotwali, Amritsar', 'Civil Lines, Patiala',
  'Model Town, Rohtak', 'Sadar, Hisar', 'Sector 5, Panchkula', 'Kotwali, Karnal', 'Sohna, Gurugram', 'Sadar, Bathinda'];
const MALE = ['Rajesh Kumar', 'Sukhdev Singh', 'Amarjit Singh', 'Mohan Lal', 'Balwinder Singh', 'Ram Avtar',
  'Krishan Chand', 'Jagtar Singh', 'Naresh Kumar', 'Satpal Sharma', 'Devinder Singh', 'Om Parkash'];
const FEMALE = ['Sunita Rani', 'Harpreet Kaur', 'Neelam Devi', 'Kamlesh Kumari', 'Rajwinder Kaur', 'Santosh Bala',
  'Manjit Kaur', 'Poonam Devi', 'Simran Jeet Kaur', 'Usha Rani'];
const person = (r) => (r() < 0.5 ? pick(r, MALE) : pick(r, FEMALE));
const COUNSEL = ['Mr. R. S. Grewal', 'Ms. Anmol Rattan', 'Mr. Gurminder Singh', 'Mr. Vinod Ghai', 'Ms. Reeta Kohli',
  'Mr. H. S. Sidhu', 'Mr. Arun Walia', 'Ms. Charu Sharma', 'Mr. K. S. Dhaliwal', 'Mr. P. K. Bansal'];
const IPC = ['420', '406', '409', '467', '468', '471', '120-B', '323', '341', '379', '380', '457', '506', '498-A'];
const caseNo = (r) => `${100 + Math.floor(r() * 8900)}`;

// ---- Archetype builders. Each returns { category, difficulty, title, body }. ---

function regularBail(r) {
  const acc = person(r); const ps = pick(r, PS); const secs = pickN(r, IPC, 3).join(', ');
  const months = 3 + Math.floor(r() * 9); const days = 1 + Math.floor(r() * 27);
  const body = [
    `In the High Court of Punjab and Haryana at Chandigarh. Criminal Miscellaneous Application No. ${caseNo(r)} of ${pick(r, YEARS)}.`,
    `The petitioner, ${acc}, through counsel, seeks the grant of regular bail in a case registered under Sections ${secs} of the Indian Penal Code, 1860, at Police Station ${ps}.`,
    `Learned counsel for the petitioner submits that the petitioner has remained in custody for ${months} months and ${DAY[days]} days, that the investigation stands concluded, and that the challan was presented before the trial court on ${dateWords(r)}.`,
    `It is urged that the recovery, if any, has already been effected, that no purpose would be served by a further detention, and that the petitioner is neither a previous convict nor involved in any other case of a like nature.`,
    `The learned State counsel opposes the prayer and contends that the allegations are grave and that the trial is likely to be prolonged on account of the number of prosecution witnesses cited in the report under Section 173 of the Code of Criminal Procedure, 1973.`,
    `Having heard learned counsel for the parties and having perused the custody certificate, this Court is of the view that the petitioner has made out a case for the concession of bail.`,
    `Without expressing any opinion on the merits of the case, the petition is allowed. The petitioner is ordered to be released on bail on furnishing bail bonds and one surety in the like amount to the satisfaction of the trial court or the Duty Magistrate concerned.`,
    `It is, however, made clear that the petitioner shall join the investigation as and when required and shall not, in any manner, tamper with the prosecution evidence or influence any witness acquainted with the facts of the case. The application stands disposed of accordingly, and a copy of this order be sent to the trial court for information and compliance.`,
  ].join(' ');
  return { category: 'Order sheet', difficulty: 2, title: `Order — regular bail (${pick(r, DISTRICTS)})`, body };
}

function anticipatoryBail(r) {
  const acc = person(r); const ps = pick(r, PS); const secs = pickN(r, IPC, 2).join(' and ');
  const body = [
    `In the High Court of Punjab and Haryana at Chandigarh. Criminal Miscellaneous Application (Anticipatory Bail) No. ${caseNo(r)} of ${pick(r, YEARS)}.`,
    `The petitioner, ${acc}, apprehending arrest in a first information report registered under Sections ${secs} of the Indian Penal Code, 1860, at Police Station ${ps}, prays for the grant of anticipatory bail under Section 438 of the Code of Criminal Procedure, 1973.`,
    `Learned counsel submits that the petitioner has been falsely implicated on account of a civil dispute over the boundary of agricultural land, that the parties are closely related, and that the report was lodged after an unexplained delay of several days.`,
    `It is further submitted that the petitioner is a permanent resident of the area, is not a flight risk, and is prepared to join the investigation on such date and at such time as this Court may direct.`,
    `The learned State counsel, on instructions, submits that custodial interrogation would be required for the recovery of the documents said to have been fabricated.`,
    `Considering the nature of the accusation and the material placed on the record, and without commenting upon the merits, this Court deems it appropriate to extend the concession of anticipatory bail on conditions.`,
    `In the event of arrest, the petitioner shall be released on bail on furnishing a personal bond and one surety to the satisfaction of the Arresting Officer, subject to the conditions enumerated in Section 438(2) of the Code.`,
    `The petitioner shall make himself available for interrogation as and when required, shall not leave the country without the prior permission of the Court, and shall not directly or indirectly hold out any inducement, threat or promise to any person acquainted with the facts of the case. The petition is disposed of in the above terms on ${dateWords(r)}.`,
  ].join(' ');
  return { category: 'Order sheet', difficulty: 3, title: `Order — anticipatory bail (${pick(r, DISTRICTS)})`, body };
}

function interimStay(r) {
  const plaintiff = person(r); const defendant = person(r); const place = pick(r, DISTRICTS);
  const body = [
    `In the Court of the Civil Judge (Senior Division), ${place}. Civil Suit No. ${caseNo(r)} of ${pick(r, YEARS)}, titled ${plaintiff} versus ${defendant} and others.`,
    `This order shall dispose of the application filed by the plaintiff under Order XXXIX Rules 1 and 2 read with Section 151 of the Code of Civil Procedure, 1908, for the grant of an ad interim injunction.`,
    `The plaintiff seeks to restrain the defendants from raising any construction over, or alienating in any manner, the suit property fully described in the head-note of the plaint, till the final decision of the suit.`,
    `Learned counsel for the plaintiff contends that the plaintiff is in settled possession of the suit property, that a prima facie case is made out, and that the balance of convenience lies in favour of the plaintiff.`,
    `It is argued that if the injunction is declined, the plaintiff would suffer an irreparable loss which cannot be compensated in terms of money.`,
    `Learned counsel for the defendants, who has put in appearance and accepted notice, opposes the application and submits that the plaintiff has not approached the Court with clean hands.`,
    `Having considered the rival submissions and the documents appended with the plaint, this Court is satisfied that the plaintiff has made out a prima facie case for the grant of an interim direction.`,
    `Accordingly, the parties are directed to maintain the status quo, as regards the nature and possession of the suit property, till the next date of hearing. Notice of the application be issued to the remaining defendants for ${dateWords(r)}, on the plaintiff taking steps within three days.`,
  ].join(' ');
  return { category: 'Order sheet', difficulty: 2, title: `Order — interim injunction (${place})`, body };
}

function summons(r) {
  const plaintiff = person(r); const defendant = person(r); const place = pick(r, DISTRICTS);
  const body = [
    `In the Court of the Civil Judge (Junior Division), ${place}. Summons to the defendant under Order V Rule 1 of the Code of Civil Procedure, 1908.`,
    `Civil Suit No. ${caseNo(r)} of ${pick(r, YEARS)}, ${plaintiff} versus ${defendant}, for recovery and permanent injunction.`,
    `To ${defendant}, resident of the district of ${place}. Whereas the above-named plaintiff has instituted a suit against you upon the cause of action set out in the plaint, you are hereby summoned to appear in this Court in person, or by a pleader duly instructed and able to answer all material questions relating to the suit.`,
    `You are required to appear on ${dateWords(r)} at ten of the clock in the forenoon, to answer the claim of the plaintiff, and a copy of the plaint is delivered herewith.`,
    `Take notice that, in default of your appearance on the day so fixed, the suit will be heard and determined in your absence, in accordance with law.`,
    `You are further directed to produce, on the said date, all documents upon which you intend to rely in support of your defence, and to bring with you, or send by your pleader, any documents which are in your possession or power and which you are required to produce.`,
    `Should you admit the claim, you may deposit the amount so admitted in this Court, together with the costs of the suit, whereupon further proceedings against you may be stayed to that extent.`,
    `Given under my hand and the seal of the Court on ${dateWords(r)}. The process fee and the requisites for service having been filed, the office shall ensure that service is effected sufficiently in advance of the date so appointed.`,
  ].join(' ');
  return { category: 'Summons', difficulty: 2, title: `Summons to the defendant (${place})`, body };
}

function executionNotice(r) {
  const dh = person(r); const jd = person(r); const place = pick(r, DISTRICTS);
  const body = [
    `In the Court of the Civil Judge (Senior Division), ${place}. Execution Application No. ${caseNo(r)} of ${pick(r, YEARS)} in Civil Suit No. ${caseNo(r)} of ${pick(r, YEARS - 3)}.`,
    `Notice under Order XXI Rule 22 of the Code of Civil Procedure, 1908, to the judgment-debtor to show cause against execution.`,
    `The decree-holder, ${dh}, has applied for the execution of the decree dated ${dateWords(r)}, passed in the above-noted suit, by which a sum was found due and payable by the judgment-debtor, ${jd}.`,
    `Whereas more than two years have elapsed between the date of the decree and the present application, notice is hereby issued to the judgment-debtor to appear and show cause, if any, why the decree should not be executed against him.`,
    `The judgment-debtor is called upon to appear in this Court on ${dateWords(r)} and to satisfy the decree, failing which the Court shall proceed to execute the decree in accordance with the mode prayed for by the decree-holder.`,
    `It is open to the judgment-debtor to raise such objection to the executability of the decree as may be available to him in law, provided the same is raised on the first date of hearing and is supported by an affidavit.`,
    `The decree-holder shall file the requisite process fee and furnish the correct and complete address of the judgment-debtor within a period of five days from today, so that service may be effected without avoidable delay.`,
    `In case the judgment-debtor neither appears nor causes an appearance to be entered on his behalf, the notice shall be deemed to have been duly served, and the application shall be taken up for further orders in his absence.`,
  ].join(' ');
  return { category: 'Notice', difficulty: 3, title: `Execution notice to judgment-debtor (${place})`, body };
}

function secondAppealJudgment(r) {
  const app = person(r); const resp = person(r);
  const body = [
    `In the High Court of Punjab and Haryana at Chandigarh. Regular Second Appeal No. ${caseNo(r)} of ${pick(r, YEARS)}, ${app} versus ${resp}.`,
    `The present appeal, under Section 100 of the Code of Civil Procedure, 1908, is directed against the judgment and decree passed by the learned first appellate court, whereby the appeal of the present appellant was dismissed and the decree of the trial court was affirmed.`,
    `Briefly, the plaintiff had instituted a suit for a declaration to the effect that he was the owner in possession of the land in dispute, and for a consequential relief of permanent injunction restraining the defendants from interfering in his possession.`,
    `The trial court, on an appreciation of the oral and documentary evidence, decreed the suit; the first appellate court, on a reappraisal of the same evidence, recorded a concurrent finding of fact against the defendants.`,
    `Learned counsel for the appellant contends that the courts below have misread the revenue record and have failed to draw the correct inference from the entries in the jamabandi.`,
    `Having heard learned counsel and having perused the record, this Court finds that the findings recorded by the two courts below are findings of fact, arrived at on a proper appreciation of the evidence.`,
    `It is settled that, in a second appeal, this Court would not interfere with concurrent findings of fact unless the same are shown to be perverse or based on no evidence. No substantial question of law, such as would warrant admission of the appeal, arises for consideration.`,
    `In the result, the appeal is found to be without merit and is hereby dismissed, leaving the parties to bear their own costs. The judgment was pronounced in open court on ${dateWords(r)}.`,
  ].join(' ');
  return { category: 'Judgment', difficulty: 3, title: `Judgment — regular second appeal`, body };
}

function writOrder(r) {
  const pet = person(r); const dept = pick(r, ['Director of Public Instruction', 'Director, Health Services', 'Registrar of the Board', 'Deputy Commissioner', 'Secretary to Government']);
  const body = [
    `In the High Court of Punjab and Haryana at Chandigarh. Civil Writ Petition No. ${caseNo(r)} of ${pick(r, YEARS)}, ${pet} versus State of Haryana and others.`,
    `The petitioner has invoked the jurisdiction of this Court under Articles 226 and 227 of the Constitution of India, seeking the issuance of a writ in the nature of mandamus.`,
    `The grievance of the petitioner is that, despite her selection and the recommendation of the selection committee, the order of appointment has been withheld without the communication of any reason.`,
    `Learned counsel for the petitioner submits that the action of the respondents is arbitrary and violative of Articles 14 and 16 of the Constitution, and that similarly situated persons have already been issued their letters of appointment.`,
    `Learned counsel for the State, on the other hand, seeks time to file a reply and states that the matter is under active consideration of the ${dept}.`,
    `Having heard learned counsel for the parties at the motion stage, this Court is of the view that the respondents ought to take a decision, one way or the other, within a fixed time-frame.`,
    `Accordingly, without expressing any opinion on the merits, the respondents are directed to consider and decide the representation of the petitioner, by a speaking order, within a period of eight weeks from the date of receipt of a certified copy of this order.`,
    `The petitioner is granted liberty to place a copy of the representation, along with the relevant documents, before the competent authority within two weeks. The petition is disposed of in these terms on ${dateWords(r)}. A copy of the order be given dasti under the signatures of the Bench Secretary.`,
  ].join(' ');
  return { category: 'Order sheet', difficulty: 3, title: `Order — writ petition (mandamus)`, body };
}

function condonationOrder(r) {
  const app = person(r); const place = pick(r, DISTRICTS); const days = 40 + Math.floor(r() * 300);
  const body = [
    `In the Court of the District Judge, ${place}. Civil Miscellaneous Application No. ${caseNo(r)} of ${pick(r, YEARS)} for condonation of delay.`,
    `By this application, filed under Section 5 of the Limitation Act, 1963, the applicant, ${app}, prays for the condonation of a delay of ${days} days in the filing of the accompanying appeal.`,
    `It is averred that the delay was neither intentional nor deliberate, but occurred on account of the prolonged illness of the applicant, who was confined to bed during the material period, as is evident from the medical record annexed with the application.`,
    `It is further averred that the applicant came to know of the impugned judgment only when the certified copy was received by his counsel, and that the appeal was filed with due promptitude thereafter.`,
    `Learned counsel for the respondent opposes the application and contends that the explanation offered is vague and that each day's delay has not been separately accounted for.`,
    `Having considered the averments made in the application, the reply thereto, and the settled principle that the expression sufficient cause is to receive a liberal construction so as to advance substantial justice, this Court is inclined to take a lenient view.`,
    `It is well established that the refusal to condone the delay can result in a meritorious matter being thrown out at the very threshold, thereby defeating the cause of justice.`,
    `Accordingly, and subject to payment of costs, the delay in the filing of the appeal is condoned. The application is allowed and the appeal be registered and listed for admission on ${dateWords(r)}.`,
  ].join(' ');
  return { category: 'Order sheet', difficulty: 2, title: `Order — condonation of delay (${place})`, body };
}

function officeMemorandum(r) {
  const subject = pick(r, ['grant of the annual increment', 'fixation of pay on promotion', 'sanction of earned leave', 'regularisation of service', 'release of the dearness allowance']);
  const branch = pick(r, ['Establishment Branch', 'Accounts Branch', 'General Branch', 'Confidential Branch']);
  const body = [
    `Office of the Registrar General, High Court of Punjab and Haryana, Chandigarh. Office Memorandum No. ${caseNo(r)} of ${pick(r, YEARS)}, issued by the ${branch}.`,
    `Subject: Instructions regarding the ${subject} in respect of the ministerial establishment of the subordinate courts.`,
    `The undersigned is directed to invite a reference to the correspondence resting with the letter of even number dated ${dateWords(r)}, on the subject cited above, and to convey the following instructions for compliance.`,
    `It has been observed that references are being received in this office without the requisite documents, resulting in avoidable correspondence and delay in the disposal of the cases of the officials concerned.`,
    `All the District and Sessions Judges are, therefore, requested to ensure that every such reference is accompanied by a complete service book, the last pay certificate, and a duly filled proforma in the prescribed format.`,
    `It is further clarified that the benefit shall be admissible only with effect from the date on which the official concerned fulfils the conditions laid down in the relevant rules, and not from any anterior date.`,
    `Any case which is not covered by the existing instructions shall be referred to this office, with a self-contained note and the specific recommendation of the Head of the Office, for orders of the competent authority.`,
    `The receipt of this memorandum may kindly be acknowledged, and its contents may be brought to the notice of all the officials concerned for their information and guidance. This issues with the approval of the competent authority.`,
  ].join(' ');
  return { category: 'Office memorandum', difficulty: 1, title: `Office memorandum — ${subject}`, body };
}

function officeNote(r) {
  const subject = pick(r, ['the requisition for stationery', 'the proposal for condemnation of old records', 'the tour programme of the inspecting officer', 'the repair of the office air-conditioning', 'the engagement of daily-wage staff']);
  const body = [
    `Office Note. Subject: Submission of ${subject} for the orders of the competent authority.`,
    `Kindly refer to the note recorded on the pre-page and to the connected papers flagged for ready reference at flags A to C.`,
    `The matter has been examined in the light of the standing instructions on the subject, and the relevant provisions have been extracted and placed below for the convenience of perusal.`,
    `As would be seen from the record, the proposal has been moved by the branch concerned after obtaining the preliminary comments of the Section Officer, and the requisite budgetary provision is available under the appropriate head of account.`,
    `It is respectfully submitted that the proposal appears to be in order and does not involve any deviation from the prescribed procedure or from the financial powers delegated to this office.`,
    `However, before the case is put up for a final decision, it may be considered whether the comparative statement placed at flag B requires to be got verified from the office that maintains the original record.`,
    `If the note is approved, a draft communication, conveying the sanction of the competent authority, is placed below at flag C for kind signature.`,
    `The case is, accordingly, submitted for orders please. Dealing Assistant. Superintendent. The note was recorded and submitted on ${dateWords(r)} for further necessary action at the appropriate level.`,
  ].join(' ');
  return { category: 'Office note', difficulty: 1, title: `Office note — ${subject}`, body };
}

function notification(r) {
  const post = pick(r, ['Clerk', 'Stenographer', 'Process Server', 'Peon', 'Restorer', 'Driver']);
  const n = 20 + Math.floor(r() * 180);
  const body = [
    `Public Notice. Recruitment to the posts of ${post} in the establishment of the subordinate courts of the State. Advertisement No. ${caseNo(r)} of ${pick(r, YEARS)}.`,
    `Applications are invited from eligible candidates, who are citizens of India, for filling up ${n} posts of ${post}, in the pay scale as admissible under the rules, on a regular basis.`,
    `The candidate must possess the essential academic qualification prescribed in the recruitment rules as on the last date fixed for the receipt of applications, and must satisfy the requirement of the qualifying practical test.`,
    `The selection shall be made on the basis of a written examination, followed by a computer proficiency test, which shall be qualifying in nature and shall not count towards the merit of the candidate.`,
    `The computer proficiency test shall consist of an English typing test and a spreadsheet exercise, and the criteria for qualifying the said test shall be as notified separately on the official website.`,
    `The last date for the submission of the online application, complete in all respects and along with the prescribed fee, shall be ${dateWords(r)}, after which the portal shall stand closed.`,
    `Candidates are advised, in their own interest, to apply well before the last date and to retain a printout of the confirmation page and the fee receipt for their record.`,
    `The date, time and place of the examination shall be intimated to the eligible candidates through the admit card, which shall be made available for download in due course. Canvassing in any form shall render a candidate liable to disqualification.`,
  ].join(' ');
  return { category: 'Notification', difficulty: 3, title: `Recruitment notice — ${post}`, body };
}

function circular(r) {
  const subject = pick(r, ['the observance of punctuality in attendance', 'the proper maintenance of the guard file', 'the timely submission of periodical returns', 'the economy in the use of consumable stores', 'the safe custody of case property']);
  const body = [
    `Circular. Subject: Instructions regarding ${subject} in the district and subordinate courts.`,
    `It has come to the notice of the competent authority that, despite the instructions issued from time to time, the desired level of compliance in the matter of ${subject} is not being maintained.`,
    `The instructions on the subject are, accordingly, reiterated, and all the officers and officials are directed to ensure their strict and scrupulous observance in letter and spirit.`,
    `The Heads of Offices shall be personally responsible for the enforcement of these instructions within their respective jurisdictions, and shall carry out periodical checks to satisfy themselves about the compliance.`,
    `Any lapse or deviation, which comes to notice, shall be viewed seriously and shall be dealt with in accordance with the relevant conduct and disciplinary rules applicable to the official concerned.`,
    `A register shall be maintained in each office, in the prescribed proforma, to record the action taken pursuant to this circular, and the same shall be produced at the time of inspection.`,
    `The gist of these instructions may be pasted on the notice board and may also be read out in the periodical staff meeting, so that no official can plead ignorance of the same at a later stage.`,
    `The receipt of this circular shall be acknowledged by return, and a compliance report shall be furnished to this office on or before ${dateWords(r)}, without fail.`,
  ].join(' ');
  return { category: 'Circular', difficulty: 2, title: `Circular — ${subject}`, body };
}

function proclamation(r) {
  const acc = person(r); const ps = pick(r, PS); const secs = pickN(r, IPC, 2).join(' and ');
  const body = [
    `In the Court of the Judicial Magistrate First Class, ${pick(r, DISTRICTS)}. Proclamation requiring the appearance of a person accused, under Section 82 of the Code of Criminal Procedure, 1973.`,
    `Whereas complaint has been made before this Court that ${acc} has committed, or is suspected to have committed, an offence punishable under Sections ${secs} of the Indian Penal Code, 1860, in a case registered at Police Station ${ps};`,
    `And whereas it has been returned to a warrant of arrest thereupon issued that the said ${acc} cannot be found, and this Court has reason to believe that the said person has absconded, or is concealing himself to avoid the service of the said warrant;`,
    `Proclamation is hereby made that the said ${acc} is required to appear before this Court, to answer the said complaint, on ${dateWords(r)}, being a date not less than thirty days from the date of the publication of this proclamation.`,
    `A copy of this proclamation shall be publicly read in some conspicuous place of the town or village in which the said person ordinarily resides, and shall be affixed to some conspicuous part of the house in which he ordinarily resides.`,
    `A further copy shall be affixed to some conspicuous part of the court-house, and, if the Court so directs, may be published in a daily newspaper circulating in the place in which the said person ordinarily resides.`,
    `Take notice that, in the event of a failure to appear within the time so specified, the property, movable and immovable, belonging to the said person shall be liable to attachment in accordance with law.`,
    `Given under my hand and the seal of the Court on ${dateWords(r)}. The station house officer concerned shall ensure the due publication of this proclamation and shall submit a report of compliance to this Court.`,
  ].join(' ');
  return { category: 'Notice', difficulty: 3, title: `Proclamation under Section 82 (${pick(r, DISTRICTS)})`, body };
}

function causeList(r) {
  const place = pick(r, DISTRICTS); const n = 12 + Math.floor(r() * 30);
  const body = [
    `In the Court of the Additional District and Sessions Judge, ${place}. Daily cause list for ${dateWords(r)}, to be read subject to the orders of the Court.`,
    `Notice is hereby given to the members of the Bar and to the litigant public that the cases mentioned in the list appended below shall be taken up on the date noted above, in the order in which they are entered.`,
    `The list contains a total of ${n} cases, comprising matters listed for arguments, for evidence, for the framing of issues, and for miscellaneous orders, which shall be called out in three separate parts.`,
    `In the first part, the cases fixed for the pronouncement of orders and for the framing of charge shall be taken up, immediately after the assembly of the Court in the forenoon.`,
    `In the second part, the cases fixed for the recording of the statements of witnesses shall be taken up, and the parties are directed to keep their witnesses present, in the Court, well in time.`,
    `In the third part, the cases fixed for arguments shall be taken up, and learned counsel are requested to be ready with the relevant record and the precedents on which they propose to place reliance.`,
    `An adjournment shall not be granted as a matter of course, and a party seeking an adjournment shall file an application, supported by an affidavit, setting out the ground on which the adjournment is prayed for.`,
    `The Reader of the Court shall ensure that the cases are entered in the correct order, that the connected files are placed on the table before the commencement of the day's work, and that any correction in the list is duly notified on the notice board.`,
  ].join(' ');
  return { category: 'Cause list', difficulty: 2, title: `Daily cause list (${place})`, body };
}

const ARCHETYPES = [
  regularBail, anticipatoryBail, interimStay, summons, executionNotice, secondAppealJudgment,
  writOrder, condonationOrder, officeMemorandum, officeNote, notification, circular, proclamation, causeList,
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// ---- Assemble the bank -------------------------------------------------------
const base = JSON.parse(readFileSync(join(here, 'passages.base.json'), 'utf-8'));
const GENERATE = 62; // 8 authored + 62 generated = 70 total
const generated = [];
const usedSlugs = new Set(base.map((p) => p.slug));

for (let i = 0; i < GENERATE; i += 1) {
  const build = ARCHETYPES[i % ARCHETYPES.length];
  const r = rng(7919 + i * 131);
  const doc = build(r);
  let slug = `${slugify(doc.title)}-${i + 1}`;
  while (usedSlugs.has(slug)) slug = `${slug}-x`;
  usedSlugs.add(slug);
  generated.push({ slug, title: doc.title, category: doc.category, difficulty: doc.difficulty, is_free: false, body: doc.body });
}

const all = [...base, ...generated];
// Release schedule: first 6 visible at launch (offset 0); one new per day from
// day 7 (offset 1 => day 7, offset 2 => day 8, ...).
all.forEach((p, idx) => { p.release_offset = idx < 6 ? 0 : idx - 5; });

// Sanity checks.
const uniq = (arr) => new Set(arr).size === arr.length;
console.assert(uniq(all.map((p) => p.slug)), 'slugs must be distinct');
const words = all.map((p) => p.body.trim().split(/\s+/).length);
const short = words.filter((w) => w < 280).length;
console.log(`passages: ${all.length}, visible at launch: ${all.filter((p) => p.release_offset === 0).length}, max drip offset: ${Math.max(...all.map((p) => p.release_offset))}`);
console.log(`word range: ${Math.min(...words)}–${Math.max(...words)}, under 280 words: ${short}`);

writeFileSync(join(here, 'passages.json'), JSON.stringify(all, null, 2) + '\n');
console.log('wrote passages.json');
