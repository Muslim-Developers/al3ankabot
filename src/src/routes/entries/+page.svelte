<script lang="ts">
  import {
    Heading,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import type { LexicalEntry } from '$lib/api-types';

  export let data: PageData;

  function getWord(entry: LexicalEntry) {
    return entry.wordForms[0].formRepresentations[0].form;
  }
  function getDefinition(entry: LexicalEntry) {
    // @ts-ignore
    return entry.senses[0].definition.textRepresentations?.[0]?.form ?? '';
  }
</script>

<main class="max-w-4xl pt-5 mx-auto items-center justify-center">
  <Table striped shadow class="text-right">
    <caption>
      <Heading class="my-3">المدخلات</Heading>
      <hr />
    </caption>
    <TableHead>
      <TableHeadCell>الكلمة</TableHeadCell>
      <TableHeadCell>معناها</TableHeadCell>
      <TableHeadCell>أضافها</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each data.entries as entry}
        <TableBodyRow>
          <TableBodyCell>{getWord(entry)}</TableBodyCell>
          <TableBodyCell>{getDefinition(entry)}</TableBodyCell>
          <TableBodyCell>Hamza Salem</TableBodyCell>
        </TableBodyRow>
      {:else}
        لم يتم تسجيل أي مدخلات بعد
      {/each}
    </TableBody>
  </Table>
</main>
