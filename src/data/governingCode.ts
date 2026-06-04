export interface Section {
  id: string;
  text: string;
}

export interface Article {
  id: string;
  title: string;
  sections: Section[];
}

export const CONSTITUTION_DATA: Article[] = [
  {
    id: "Article I",
    title: "Article I: Name",
    sections: [
      { id: "Section 1", text: "The Constitution and Bylaws will be referred as “The Light” for this document. This organization shall be known as Kappa Pi founded in Atlanta, GA. Organizational members shall be located throughout the United States. The organization shall be composed of members as defined by the Constitution and Bylaws." }
    ]
  },
  {
    id: "Article II",
    title: "Article II: Purpose",
    sections: [
      { id: "General", text: "The purpose of Kappa Pi is to cultivate and encourage high scholastic and ethical standards, to promote unity and friendship among college educated men, to study and help alleviate problems concerning all people in order to improve their social stature, to maintain a progressive interest in college life, and to be of service to all mankind as stated in “The Light” of the “The Mother”. Kappa Pi is of shared purpose to cultivate men who: Improve their communities through unselfish leadership and live among the highest standards of sophistication, fully compliment the mission of the organization, and gladly welcome the sacrifice and sanctity of relationship." }
    ]
  },
  {
    id: "Article III",
    title: "Article III: Mission",
    sections: [
      { id: "General", text: "Kappa Pi realizes the importance of an organization to improve the general welfare of our community. As a group of individuals, we will strive to provide a challenge to self and others, to maintain a partnership between academic excellence and high ethical standards, as well as remain actively involved in the advancement of our community. Through unity and cultural diversity, we seek to strengthen the bond of friendship and servanthood. The mission of Kappa Pi is to inspire a brotherhood/sisterhood for men, based on the precepts of “The Mother”, that: demands excellence, enriches lives, and encourages an elegant upward strive for the ideals of knowledge, love, loyalty, and truth." }
    ]
  },
  {
    id: "Article IV",
    title: "Article IV: Membership",
    sections: [
      { id: "Section 1", text: "Qualifications for membership into Kappa Pi will follow those outlined in “The Light”. In addition, an individual seeking membership into Kappa Pi will also have to meet qualifications set by the organization which includes being a member of a traditional Greek Letter Organization. Honor societies (i.e organizations that do not have a forum where information is learned about the organization through a pledge class and do not have a private initiation ceremony) are not appropriate forms of traditional Greek Letter organizations." },
      { id: "Section 2", text: "A financial member of Kappa Pi is a member who has met all the financial requirements for the current year, including all assessments, fees, or dues. If a member has not paid all the required assessments, fees, or dues, they do not have the rights and privileges afforded to a member such as voting. The dues and assessments of this organization shall be set annually by the membership committee along with the Tamiouchos. All dues are to be paid to the Tamiouchos via the current chapter bank account on the date set forth by the Directorate. Any Assessments Penalties or previous late fees shall be collected before members pay annual organizational dues. Late fees shall increase by $5.00 per month, but not to exceed $15.00 per financial year. Officers and potential candidates for office must have paid all current financial obligations and dues for the previous year prior to installation." },
      { id: "Section 3", text: "General membership is granted to a member who is pursuing, or who has earned, a baccalaureate, graduate, or professional degree from an accredited four-year senior college or university." },
      { id: "Section 3A", text: "An undergraduate or graduate candidate who is the son, grandson, adopted son, stepson, or legal ward of an active or deceased member of “The Mother” organization, is considered a Legacy Candidate and may be considered for membership into the chapter. The Legacy Candidate must meet all requirements that have been set by the chapter for membership and properly voted on by the financial members of the chapter." },
      { id: "Section 4", text: "A member of Kappa Pi shall not accept any type of membership in other organizations or sisterhoods, that are similar to the purpose and mission of the organization. Kappa Pi members may belong to other organizations or sisterhoods of an honorary or professional nature." },
      { id: "Section 5", text: "The rights of a financial member of Kappa Pi include: the right to vote in organizational meetings, hold office, and to officially represent the organization at events, programs, and conferences." },
      { id: "Section 6", text: "Each individual member shall have knowledge of and shall fully comply, in good faith, with all provisions of “The Light”. Penalties or sanctions shall be imposed when an individual member violates their obligations under “The Light”." },
      { id: "Section 7", text: "A member may have individual privileges withdrawn, be suspended, be expelled, or be imposed fines. Withdrawal of individual privileges shall be imposed for a period not to exceed twelve (12) months. Suspension of an individual member shall be imposed for a period not less than twelve (12) months or more than five (5) years. Suspension of an individual member shall disqualify the individual member from participating in organizational activities for the period of the suspension and until restored to good standing by the Judicial and Ethics Committee. Expulsion of an individual member shall be imposed as a permanent revocation of membership. Expulsion shall revoke the individual's membership in Kappa Pi. Membership shall not be revoked except by a two-thirds vote of the Judicial and Ethics Committee. An individual member may be expelled from Kappa Pi, only by action of the Judicial and Ethics Committee and the Directorate. Expulsion shall require two-thirds of the votes cast. Fines may be imposed by the Directorate and approved by the Basileus. Withdrawal of privileges may include: forfeiture of vote, hold office, participation in step shows or Membership Intake Process (MIP), etc." },
      { id: "Section 8", text: "Any individual member having grievances with the ruling of the Judicial and Ethics Committee affecting any substantial question should not hesitate to file an appeal. The individual member must first appeal to the Judicial and Ethics Committee within 30 days to reconsider the ruling. If the ruling is not reversed, the individual member should then make an appeal to the Basileus. The process of an individual member making an appeal is that the request be made in writing to the Judicial and Ethics Committee. The appeal should be made to the Judicial and Ethics Committee no later than 60 days following the Judicial and Ethics Committee ruling. If the decision rendered is unsatisfactory to the grievant, the grievant may appeal in writing to the Basileus. The Basileus will schedule a hearing with the Directorate at the earliest appropriate time. Only the involved parties shall be present. Deliberation and final decisions are managed by the Directorate." },
      { id: "Section 9", text: "An individual member subject to withdrawal of privileges shall be restored to good standing when the cause of the penalty is removed; when the time specified in “The Light” has expired; when the financial obligations have been met, or by a two-thirds vote of the Judicial and Ethics Committee." }
    ]
  },
  {
    id: "Article V",
    title: "Article V: Membership Intake Process (MIP)",
    sections: [
      { id: "Section 1", text: "The Membership Intake Process (MIP) shall be conducted according to the process adopted by the Membership and Membership Intake Committees and approved by the Directorate." },
      { id: "Section 2", text: "No member of the organization shall engage actively or passively with individuals who have expressed an interest in Kappa Pi prior to the Membership Intake ceremonies. The official and only membership intake process of Kappa Pi shall be developed by the Membership and Membership Intake Committees and approved by the Directorate." },
      { id: "Section 3", text: "All prospective candidates will fill out and return a written application to the chapter, which will be scored by the Membership Committee, and must obtain a score of 80 and above in order to be offered an interview for possible selection to participate in the Membership Intake Process. After interviews of prospective candidates have been conducted, the candidates must be properly voted on, by financial members only, and they must obtain half of the financial member votes plus one in order to be offered selection to be a part of the Membership Intake Process." },
      { id: "Section 3A", text: "Proxy Votes: A financial member is able to provide a proxy vote, but must provide a written request to the Membership Committee Chair, stating that they would like to vote by proxy and who the member plans to give their proxy vote to. Proxy votes will only be accepted on the first day that voting begins. Proxy votes received after the first day of voting, will not be counted." },
      { id: "Section 4", text: "The Membership Intake Process shall not exceed no longer than four calendar months." },
      { id: "Section 5", text: "The Membership Intake Process shall, for just cause, be discontinued for any prospective member, with the approval of the Membership and Membership Intake Committees and approved by the Directorate." },
      { id: "Section 6", text: "In the event a prospective candidate has experienced or witnessed hazing but refuses to admit proven action, she shall not be initiated." },
      { id: "Section 6A", text: "Definition of Hazing: Kappa Pi defines hazing as an act or series of acts which includes, but is not limited to physical acts such as hitting, striking, laying hands upon or threatening to do bodily harm to any individual(s) while acting in one's capacity as a member of Kappa Pi, behavior which is directed against any individual(s) for the purpose of causing shame, abuse, insult, humiliation, intimidation or disgrace, and a variety of prohibited practices. Hazing is strictly prohibited and will not be tolerated in any form by the organization. The penalty for hazing by an individual member shall be suspension or expulsion. A fine may also be imposed on an individual member for hazing." },
      { id: "Section 7", text: "Kappa Pi members or prospective candidates will not engage in any sexual acts of any kind, at any point during the Membership Intake Process. The penalty for following this action shall be suspension or expulsion of a member and/or a prospective candidate to be removed from the Membership Intake Process." }
    ]
  },
  {
    id: "Article VI",
    title: "Article VI: Officers",
    sections: [
      { id: "Section 1", text: "The members of the Directorate shall be the Basileus, the 1st Anti-Basileus, the 2nd Anti-Basileus, the Grammateus, the Pecunious Grammateus, the Tamiouchos, the Epistoleus, the Hodegos, and the Historian. Basileus: Preside at meetings, prepare agenda, approve and delegate business of the organization. 1st Anti-Basileus: Assumes duties of Basileus when absent. 2nd Anti-Basileus: Assumes duties if 1st Anti-Basileus and Basileus are absent, must be a neophyte member. Grammateus: Maintains accurate records of proceedings, rosters, and minutes. Pecunious Grammateus: Records all monies, receipts, duplicates, and journals. Tamiouchos: Guardian of funds, monthly bank statements, ledger and account. Epistoleus: General correspondence, notifications, and emails. Hodegos: Introduces visitors, handles courtesies. Historian: Maintains archives, narrative history, scrapbooks." },
      { id: "Section 2", text: "The term of office for each officer shall be for one year. Term is from July 1 – June 30." },
      { id: "Section 3", text: "Officers shall be elected in May and installed at the last meeting in June. Members shall be nominated by the organization and names will be submitted to the Nominating Committee after verification by the Pecunious Grammateus that all financial obligations have been met. All Positions will require the member to be part of the organization for at least a year unless positions are left vacant, except for 2nd Anti-Basileus which must be a Neophyte." },
      { id: "Section 4", text: "It shall be the duty of each officer to deliver to his successor all files, supplies, materials, and records in his possession within 14 calendar days after the installation. If not complied with, it shall be the duty of the Basileus to ensure that transfers are facilitated." }
    ]
  },
  {
    id: "Article VII",
    title: "Article VII: Meetings",
    sections: [
      { id: "Section 1", text: "Kappa Pi shall meet monthly on a date decided by the Basileus. Times and locations/means (i.e. Zoom, Google Talk, etc.) for organization meetings shall be voted upon at the first meeting of each sorority year." },
      { id: "Section 2", text: "The Directorate meetings should be held monthly on the Wednesday that the organization does not meet. Minutes from each meeting shall be posted for view by the Friday after each executive meeting. All Directorate meetings are open to all organizational members however, voting is only done by executive members." },
      { id: "Section 3", text: "Rescheduling meetings can be done by the Basileus. Other meeting dates may be designated at the discretion of the Basileus, Directorate, and the organization must be made aware of the meeting dates within 24-hours before the scheduled meeting date. The last meeting in June will be for the organization to plan programmatic goals for the upcoming year." },
      { id: "Section 4", text: "Members will be notified of meetings by the Basileus via the Kappa Pi Facebook group." }
    ]
  },
  {
    id: "Article VIII",
    title: "Article VIII: Directorate",
    sections: [
      { id: "Section 1", text: "The Directorate shall be composed of all officers." },
      { id: "Section 2", text: "The Directorate shall deliberate on all policies and problems of the organization. It shall present its recommendations to the organization for action. It shall address all business and make decisions for the organization if the issue cannot wait. Plurality/majority vote rules. Two-Thirds of the Directorate members must be present to transact business." },
      { id: "Section 3", text: "The members of the Directorate shall be the Basileus, the 1st Anti-Basileus, the 2nd Anti-Basileus, the Grammateus, the Pecunious Grammateus and the Tamiouchos." },
      { id: "Section 4", text: "The 2nd Anti-Basileus shall be a Neophyte member of the organization at the time of their election." },
      { id: "Section 5", text: "The Directorate shall meet on the Wednesday that the organization does not meet." },
      { id: "Section 6", text: "Quorum shall be two-thirds of the Directorate members." },
      { id: "Section 7", text: "Elections should follow the procedures prescribed in the “The Light”. The members of the Directorate shall be elected by a plurality vote at the monthly chapter meeting." }
    ]
  },
  {
    id: "Article IX",
    title: "Article IX: Committees",
    sections: [
      { id: "General", text: "All members are encouraged to join a committee. The committees shall report to the 1st Anti-Basileus. The committees shall submit final written reports of approved committee action including activities conducted, budget, number of participants, and recommendations to the Directorate within 10 calendar days after the program ends." },
      { id: "Section 1", text: "Awards and Archives: Server as the keeper of print and non-print materials, historical logs, scrapbook, past reports and minutes. The Historian shall serve as the chair." },
      { id: "Section 2", text: "Communication, Publicity, and Public Relations: Disseminates information about the chapter and chapter programs, approve all releases and advertisements for the chapter." },
      { id: "Section 3", text: "Standards: Evaluates the organization and initiatives to ensure compliance with 'The Mother' values and tenets. Chair appointed by the Basileus." },
      { id: "Section 4", text: "Constitution and Bylaws: Proposes needed changes to 'The Light' and examines proposed amendments. Review and update 'The Light' every two years." },
      { id: "Section 5", text: "Nominating: Prepares officer ballots, convenes in April to gather nominations, and structures candidate screening. Minimum of 3 appointed members." },
      { id: "Section 6", text: "Technology: Design, publish, and maintain social media, email lists, coordinates phone trees and server portals." },
      { id: "Section 7", text: "Social Affairs (Hospitality, Sisterly Relations, and Protocol): Manages all official social events, ensuring high-standard representation in the spirit of fun." },
      { id: "Section 8", text: "Membership: Focuses on recruitment, retention, reclaim, and reactive status. Chaired by the 2nd Anti-Basileus. Includes intake operations." },
      { id: "Section 9", text: "Budget, Finance and Fundraising: Prepares and reviews the annual budget, manages fundraising, audit control. Composed of Tamiouchos, 2nd Anti-Basileus and finance members." },
      { id: "Section 10", text: "Community Service: Monthly planning of service activities aligned with national impact goals, including LGBTQ+ community service programs." },
      { id: "Section 11", text: "Scholarship: Oversees scholarship criteria, application reviews, selection, and delivery/monetary dispersals." }
    ]
  },
  {
    id: "Article X",
    title: "Article X: Amendment of 'The Light'",
    sections: [
      { id: "Section 1", text: "Kappa Pi’s “The Light” is a living document and will be routinely evaluated by the Constitution and Bylaws committee for any needed modifications." },
      { id: "Section 2", text: "Any modifications or changes to “The Light” must be submitted at the chapter meeting before the meeting it will be voted upon to ensure appropriate understanding and question time." },
      { id: "Section 3", text: "If quorum is met, “The Light” may be amended by a two-thirds vote in the affirmative by the members present. The changes voted upon will take place at the close of the organization meeting." },
      { id: "Section 4", text: "“The Light” will be modified accordingly to reflect any changes made by the Constitution and Bylaws Committee, if necessary, to keep the organization in compliance." },
      { id: "Section 5", text: "After each change made to “The Light”, two copies of the updated version of “The Light” shall be submitted to the Directorate for final approval." },
      { id: "Section 6", text: "“The Light” will be reviewed and updated every two years to ensure that it is a reliable working document." }
    ]
  },
  {
    id: "Article XI",
    title: "Article XI: Ad Hoc Committees",
    sections: [
      { id: "General", text: "Ad hoc committees are appointed by the Basileus to perform specific tasks and automatically cease to exist when its final report is discarded." },
      { id: "Section 1", text: "Expansion Committee: Assist in establishing regional clusters of members, identifying metropolitan home bases, and establishing regional role & rule governance structures." },
      { id: "Section 2", text: "Judicial and Ethics: Responsible for holding individuals accountable for their actions. Conducts hearings and recommends disciplinary actions like fines, suspension, or expulsion to the Directorate." },
      { id: "Section 3", text: "The Basileus develops and appoints committees to address other issues or tasks as needed." }
    ]
  },
  {
    id: "Article XII",
    title: "Article XII: Parliamentary Authority",
    sections: [
      { id: "General", text: "The governing documents will be used in said order: 1. “The Light” 2. The rules contained in the current edition of the Robert’s Rules of Order Newly Revised." }
    ]
  }
];

export const BYLAWS_DATA: Article[] = [
  {
    id: "Article I",
    title: "Article I: Board of Directors",
    sections: [
      { id: "Section 1", text: "Composition: The Board of Directors shall consist of Seven (7) Members that include the following: a. President, b. Vice President of Operations, c. Vice President of Membership, d. Chief Executive Secretary, e. Chief Financial Officer, f. 1st Member at Large, g. 2nd Member at Large" },
      { id: "Section 2", text: "Eligibility: a. All candidates for Board membership must comply with all rules and regulations for membership, up to and including good financial standing. b. A candidate cannot hold two positions simultaneously. As such, a candidate cannot be on a local Directorate and a member of the Board. Such candidacy would be allowed only after completion of their original term." },
      { id: "Section 3", text: "Limitations of Service: a. The Vice President of Operations shall serve two years as Vice President and, following the conclusion of the term, serve an additional two years as President. b. Any Recording Secretary or Corresponding Secretary may be elected as the Chief Executive Secretary for the elected term. c. Any Treasurer or Financial Secretary may be elected as the Chief Financial Officer of the Board of Directors for the elected term. d. Two general members shall be directly elected from the general membership to the Board of Directors as 1st and 2nd Members at Large for the elected term." },
      { id: "Section 4", text: "Number of Directors: The organization shall be managed by a Board of Directors consisting of seven (7) director(s). The Board shall consist of those identified at Art. 1, Sec. 1." },
      { id: "Section 5", text: "Election and Term of Office: The directors shall be elected at the annual meeting. Each director shall serve a term of 2 year(s), or until a successor has been elected and qualified." },
      { id: "Section 6", text: "Quorum: A simple majority of directors shall constitute a quorum." },
      { id: "Section 7", text: "Adverse Interest: In the determination of a quorum of the directors, or in voting, the disclosed adverse interest of a director shall not disqualify the director or invalidate his or her vote. However, the President of the Board, shall remain disinterested, in such fashion as to have no standing vote." },
      { id: "Section 8", text: "Directorate and Officers Meetings: The Board of Directors may call for a meeting of Directors either by request of the President, by agreement of the Board of Directors or officer meetings, as the need requires. However, there shall be at least one (1) meeting per month." },
      { id: "Section 9", text: "Regular Meeting: The Board of Directors shall meet immediately after the election for the purpose of appointing new committee chairpersons and for transacting such other business as may be deemed appropriate. The Board of Directors may provide, by resolution, for additional regular meetings without notice other than the notice provided by the resolution." },
      { id: "Section 10", text: "Special Meeting: Special meetings may be requested by the President, Vice-President, Secretary, or any two directors by providing five days' written notice by ordinary United States mail, effective when mailed or emailed. Minutes of the meeting shall be sent to the Board of Directors within two weeks after the meeting." },
      { id: "Section 11", text: "Procedures: The vote of a simple majority (51% or more) of the directors present at a properly called regular or special meeting at which a quorum is present shall be the act of the Board of Directors, unless the vote of a greater number is required by law or by these by-laws for a particular resolution. A director of the organization who is present at a meeting of the Board of Directors at which action on any corporate matter is taken shall be presumed to have assented to the action taken unless their dissent shall be entered in the minutes of the meeting. The Board shall keep written minutes of its proceedings in its permanent records. If authorized by the governing body, any requirement of a written ballot shall be satisfied by a ballot submitted by electronic transmission." },
      { id: "Section 12", text: "Formal Action: Any action that requires a substantive change of the functions of a director, initiative, or activity to be engaged in by the Organization shall be subject to the procedures found in Art. 1, Section 10." },
      { id: "Section 13", text: "Informal Action: Any action which may be taken at a meeting of directors, or of a committee of directors, may be taken without a meeting if consent in writing setting forth the action so taken, is signed by all of the directors or all of the members of the committee of directors, as the case may be." },
      { id: "Section 14", text: "Removal / Vacancies: A director shall be subject to removal, with cause. Such cause shall arise from a violation of the Code of Conduct, alienation or dereliction of duties outlined in Art. 2 and 3, violation of local or federal law, or egregious behavior that would bring reproach upon the organization. Such director may be removed following a vote, at a meeting called specifically for that purpose. A director who is subject to removal, shall be subject to a vote by the general membership. A supermajority vote (66% or greater) shall ratify such removal of a director. Any vacancy that occurs on the Board of Directors, whether by death, resignation, removal or any other cause, may be filled by the remaining directors. A director elected to fill a vacancy shall serve the remaining term of his or her predecessor." },
      { id: "Section 15", text: "Resignation: Any director may resign effective upon giving written notice to the chairperson of the board, the president, the secretary or the Board of Directors of the corporation, unless the notice specifies a later time for the effectiveness of such resignation." },
      { id: "Section 16", text: "Committees: To the extent permitted by law, the Board of Directors may appoint from its members a committee or committees, temporary or permanent, and designate the duties, powers and authorities of such committees." }
    ]
  },
  {
    id: "Article II",
    title: "Article II: Directorate of Officers",
    sections: [
      { id: "Section 1", text: "Jurisdiction: The Directorate of Officers will consist of the composition as outlined in Art II. Sec. 2. Each chapter shall encompass one region in accordance with Art 5, Sec. 2. Each chapter shall maintain the arrangement and composition of such a Directorate as membership numbers shall allow and sustain." },
      { id: "Section 2", text: "Composition: The Directorate of Officers shall consist of Six Members that include the following: a. President, b. 1st Vice President, c. 2nd Vice President, d. Treasurer, e. Financial Secretary, f. Recording Secretary, g. Historian, h. Corresponding Secretary, i. Social Affairs Chair, j. Sergeant-at-Arms." },
      { id: "Section 3", text: "Eligibility: All Officer Positions will require the general member to be part of the Organization for at least a year with membership dues and any penalties fully satisfied, unless positions are left vacant and a general member may need to fill a position after they have been initiated into the Organization, except for the 2nd Vice President, which must be filled by a general member who was initiated less than two years prior." },
      { id: "Section 4", text: "Election and Term of Office: The officers shall be elected annually by the general members who are in good financial standing. Directorate of Officer positions are for a term of two years, or until a successor has been elected and qualified. Elections for Directorate of Officer positions shall take place on odd numbered years and must not occur during the same year as Board of Directorate elections." },
      { id: "Section 5", text: "Removal or Vacancy: The Board of Directors shall have the power to remove an officer or agent of the organization for cause for misconduct, alienation of position, or findings made by the Judicial and Ethics committee which prompt suspension or expulsion. Any vacancy that occurs for any reason may be filled by the Board of Directors." }
    ]
  },
  {
    id: "Article III",
    title: "Article III: Organizational Meetings",
    sections: [
      { id: "Section 1", text: "National Bi-Annual Meeting: A bi-annual national meeting shall be held once every two years in the month of June for the purpose of electing directors and for the transaction of such other business as may properly come before the meeting. The bi-annual meeting shall be held at the time and place designated by the Board of Directors during the month of June." },
      { id: "Section 2", text: "Localized Annual Meetings: Annual meeting shall be held once every year by the chapter in the month of April or May for the purpose of electing officers during the appropriate year and for the transaction of such other business as may properly come before the meeting." },
      { id: "Section 3", text: "Board Financial Meetings: The Board of Directions shall have a financial meeting to review the financial state of the organization and handle tax affairs annually in the months of February to April." },
      { id: "Section 4", text: "Special Meetings: Special meetings may be requested by the President or the Board of Directors." },
      { id: "Section 5", text: "Notice: Written notice of all meetings, whether regular or special meetings, shall be provided under this section or as otherwise required by law. The Notice shall state the place, date, and hour of the meeting. If a special meeting is requested and noticed, the purpose of the meeting shall be provided on the face of the notice. Such notice shall be emailed to all directors of record at least 10 days prior." },
      { id: "Section 6", text: "Place of Meeting: Meetings shall be held at the organization's principal place of business unless otherwise stated in the notice. Members of the general body of the Corporation may participate in any meeting of general nature by means of remote communication to the extent the Board of Directors authorizes such participation." },
      { id: "Section 7", text: "Remote Meetings: Participation by means of remote communication in any meeting shall be subject to such guidelines and procedures as the Board of Directors adopts." },
      { id: "Section 8", text: "General Member Attendance at Remote Meetings: General members participating in a regular or special meeting by means of remote communication shall be deemed present and may vote at such a meeting if the corporation has implemented reasonable measures." },
      { id: "Section 9", text: "Quorum: Board Quorum requires a majority of directors. Directorate Quorum requires a majority of officers. General Membership Quorum requires simple majority (51% or more) of active financial members." },
      { id: "Section 10", text: "Elections and Voting: Details national elections procedure for Board of Directors, local elections procedure for Directorate, voting regarding membership retention & expansion, referenda and motions, and bylaws amendment rules (quorum requirements, notice period, and copies required)." },
      { id: "Section 11", text: "Amendments to Articles of Incorporation: Substantive changes require a simple majority of all Board of Director Members, following statutory rules (O.C.G.A. § 14-2-1002)." }
    ]
  },
  {
    id: "Article IV",
    title: "Article IV: Membership",
    sections: [
      { id: "Section 1", text: "Classification: There is only one class of members in K.P. Inc., hereinafter referred to as the Organization." },
      { id: "Section 2", text: "Criteria: Candidates for membership shall meet the Bylaws's provisions and Membership Guidelines and Code of Conduct, demonstrating exemplary character as enunciated therein." },
      { id: "Section 3", text: "Nondiscrimination: All candidates for membership shall be considered regardless of race, color, national origin, marital status, gender expression, disability, religion, military status, veteran status, or membership in other organizations." },
      { id: "Section 4", text: "Resignation: A member shall be allowed to resign from the Organization providing all insignia are returned and provided no disciplinary action is pending against the member. No refund shall be made." },
      { id: "Section 5", text: "Suspension and Expulsion: A member can be suspended or expelled for cause following a determination by the disciplinary board for any violations to the Membership Guidelines and Code of Conduct. The Directorate shall report its action and reasons therefor to the next National Meeting." },
      { id: "Section 6", text: "Due Process: A member suspended or expelled may appeal the disciplinary board's decision and plead their case in appeal the case to the next National Meeting, and that member shall have the right to be heard by the general membership and to plead their own cause. The directorate shall render the final decision." }
    ]
  },
  {
    id: "Article V",
    title: "Article V: Establishment of Subdivisions",
    sections: [
      { id: "Section 1", text: "Regional Demarcation: There will be a total of five Region identified as follows: a. Northeastern Region, b. Southeastern Region, c. Midwest Region, d. Gulf Region, e. Western Region." },
      { id: "Section 2", text: "Chapters: Each Region shall comprise of one (1) Chapter until further amendment of these Bylaws." },
      { id: "Section 3", text: "[Reserved]." },
      { id: "Section 4", text: "Conditions of Continual Function: Chapters must abide by these Bylaws, the purpose as designated in the Articles of Incorporation, and the local, state, and federal laws in any place where Chapter members reside and shall conduct business." },
      { id: "Section 5", text: "Decommissioning: Decommissioning of Chapters shall occur when there are no financially active members in the chapter and this lacks persists for a period of three (3) Organizational years, or following a finding for cause of decommissioning due to misconduct, abuse, or illegal/illicit activities." }
    ]
  },
  {
    id: "Article VI",
    title: "Article VI: Corporate Seal, Execution of Instruments",
    sections: [
      { id: "General", text: "The organization shall have a corporate seal, which shall be affixed to all deeds, mortgages, and other instruments affecting or relating to real estate. All instruments that are executed on behalf of the organization which are acknowledged and which affect an interest in real estate shall be executed by the President or any Vice-President and the Secretary or Chief Financial Officer. All other instruments executed by the organization, including a release of mortgage or lien, may be executed by the President or any Vice-President." }
    ]
  },
  {
    id: "Article VII",
    title: "Article VII: Dissolution of Corporate Entity",
    sections: [
      { id: "General", text: "The organization may be dissolved only with authorization of its Board of Directors given at a special meeting called for that purpose, and with the subsequent approval by no less than two-thirds (⅔ or 66%) vote of the members. In the event of the dissolution of the organization, the assets shall be applied and distributed as follows: All liabilities and obligations shall be paid, satisfied and discharged. Assets not held upon a condition requiring return shall be distributed or conveyed to charitable and educational organization, organized under Section 501(c)(3) of the Internal Revenue Code of 1986." }
    ]
  }
];
